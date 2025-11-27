import os
import logging
from flask import Flask, request, jsonify, g, send_file
from flask_cors import CORS
import sqlite3
from datetime import datetime, timezone
import json
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# Production logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Render.com compatible DB path (FIXED)
DATABASE = os.environ.get('DATABASE_URL', '/tmp/billing.db')

# Database helper functions
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db_path = DATABASE
        os.makedirs(os.path.dirname(db_path) if os.path.dirname(db_path) else '.', exist_ok=True)
        db = g._database = sqlite3.connect(db_path, check_same_thread=False)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys=ON')
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    try:
        with app.app_context():
            db = get_db()
            db.executescript('''
                CREATE TABLE IF NOT EXISTS companies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    gst TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS partners (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    company_id INTEGER NOT NULL,
                    delivery_name TEXT NOT NULL,
                    delivery_address TEXT NOT NULL,
                    delivery_gst TEXT NOT NULL,
                    delivery_state TEXT DEFAULT 'Tamil Nadu',
                    billing_name TEXT NOT NULL,
                    billing_address TEXT NOT NULL,
                    billing_gst TEXT NOT NULL,
                    billing_state TEXT DEFAULT 'Tamil Nadu',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (company_id) REFERENCES companies (id)
                );

                CREATE TABLE IF NOT EXISTS bills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    partner_id INTEGER NOT NULL,
                    bill_number TEXT NOT NULL,
                    invoice_date TEXT NOT NULL,
                    reverse_charge TEXT DEFAULT 'No',
                    po_number TEXT,
                    po_date TEXT,
                    state TEXT DEFAULT 'Tamil Nadu',
                    state_code TEXT DEFAULT '33',
                    vendor_code TEXT,
                    transportation_mode TEXT DEFAULT 'Road Ways',
                    vehicle_number TEXT,
                    date_of_supply TEXT NOT NULL,
                    place_of_supply TEXT DEFAULT 'Tamil Nadu',
                    billing_method TEXT DEFAULT 'method1',
                    line_items TEXT NOT NULL,
                    subtotal REAL NOT NULL,
                    cgst_rate REAL DEFAULT 9.0,
                    sgst_rate REAL DEFAULT 9.0,
                    cgst_amount REAL NOT NULL,
                    sgst_amount REAL NOT NULL,
                    total_gst REAL NOT NULL,
                    grand_total REAL NOT NULL,
                    bank_account_number TEXT,
                    bank_name TEXT,
                    bank_ifsc_code TEXT,
                    bank_branch TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (partner_id) REFERENCES partners (id)
                );

                CREATE TABLE IF NOT EXISTS autocomplete_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    field_name TEXT NOT NULL,
                    field_value TEXT NOT NULL,
                    partner_id INTEGER,
                    last_used TEXT NOT NULL,
                    use_count INTEGER DEFAULT 1,
                    UNIQUE(field_name, field_value, partner_id)
                );

                CREATE TABLE IF NOT EXISTS product_descriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS hsn_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    code TEXT NOT NULL UNIQUE,
                    description TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS units (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );
            ''')
            db.commit()
            logger.info("✓ Database initialized successfully")
    except Exception as e:
        logger.error(f"Database init error: {e}")

def migrate_db():
    """Migrate existing database"""
    try:
        with app.app_context():
            db = get_db()
            try:
                db.execute('SELECT delivery_state FROM partners LIMIT 1')
            except sqlite3.OperationalError:
                db.execute('ALTER TABLE partners ADD COLUMN delivery_state TEXT DEFAULT "Tamil Nadu"')
                db.execute('ALTER TABLE partners ADD COLUMN billing_state TEXT DEFAULT "Tamil Nadu"')
                db.commit()
                logger.info("✓ Added state columns")

            try:
                db.execute('SELECT billing_method FROM bills LIMIT 1')
            except sqlite3.OperationalError:
                db.execute('ALTER TABLE bills ADD COLUMN billing_method TEXT DEFAULT "method1"')
                db.commit()
                logger.info("✓ Added billing_method column")
    except Exception as e:
        logger.warning(f"Migration note: {e}")

def save_autocomplete(field_name, field_value, partner_id=None):
    if not field_value or field_value.strip() == '':
        return
    db = get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.execute('''
            INSERT INTO autocomplete_history (field_name, field_value, partner_id, last_used, use_count)
            VALUES (?, ?, ?, ?, 1)
            ON CONFLICT(field_name, field_value, partner_id) 
            DO UPDATE SET last_used = ?, use_count = use_count + 1
        ''', (field_name, field_value, partner_id, now_iso, now_iso))
        db.commit()
    except Exception as e:
        logger.error(f"Error saving autocomplete: {e}")

def number_to_words(n):
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    
    def convert_less_than_thousand(num):
        if num == 0:
            return ''
        elif num < 10:
            return ones[num]
        elif num < 20:
            return teens[num - 10]
        elif num < 100:
            return tens[num // 10] + (' ' + ones[num % 10] if num % 10 != 0 else '')
        else:
            return ones[num // 100] + ' Hundred' + (
                ' And ' + convert_less_than_thousand(num % 100) if num % 100 != 0 else '')
    
    if n == 0:
        return 'Zero Rupees Only'
    
    crore = n // 10000000
    n %= 10000000
    lakh = n // 100000
    n %= 100000
    thousand = n // 1000
    n %= 1000
    
    result = ''
    if crore:
        result += convert_less_than_thousand(crore) + ' Crore '
    if lakh:
        result += convert_less_than_thousand(lakh) + ' Lakh '
    if thousand:
        result += convert_less_than_thousand(thousand) + ' Thousand '
    if n:
        result += convert_less_than_thousand(n)
    
    return result.strip() + ' Rupees Only'

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'database': DATABASE}), 200

# AUTOCOMPLETE ENDPOINTS
@app.route('/api/autocomplete/<field_name>', methods=['GET'])
def get_autocomplete(field_name):
    partner_id = request.args.get('partner_id')
    db = get_db()
    try:
        if partner_id:
            results = db.execute('''
                SELECT field_value, use_count FROM autocomplete_history 
                WHERE field_name = ? AND partner_id = ?
                ORDER BY use_count DESC, last_used DESC LIMIT 10
            ''', (field_name, partner_id)).fetchall()
        else:
            results = db.execute('''
                SELECT field_value, use_count FROM autocomplete_history 
                WHERE field_name = ?
                ORDER BY use_count DESC, last_used DESC LIMIT 10
            ''', (field_name,)).fetchall()
        return jsonify([dict(r) for r in results]), 200
    except Exception as e:
        logger.error(f"Error fetching autocomplete: {e}")
        return jsonify([]), 200

# PRODUCT DESCRIPTIONS ENDPOINTS
@app.route('/api/products', methods=['GET'])
def get_products():
    db = get_db()
    try:
        products = db.execute('SELECT * FROM product_descriptions ORDER BY name ASC').fetchall()
        return jsonify([dict(p) for p in products]), 200
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        return jsonify([]), 200

@app.route('/api/products', methods=['POST'])
def add_product():
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    product_name = data.get('name', '').strip()
    if not product_name:
        return jsonify({'error': 'Product name is required'}), 400
    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO product_descriptions (name, created_at) VALUES (?, ?)',
            (product_name, datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        product = db.execute('SELECT * FROM product_descriptions WHERE id = ?', (cursor.lastrowid,)).fetchone()
        return jsonify(dict(product)), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Product already exists'}), 409
    except Exception as e:
        logger.error(f"Error adding product: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# HSN CODES ENDPOINTS
@app.route('/api/hsn-codes', methods=['GET'])
def get_hsn_codes():
    db = get_db()
    try:
        hsn_codes = db.execute('SELECT * FROM hsn_codes ORDER BY code ASC').fetchall()
        return jsonify([dict(h) for h in hsn_codes]), 200
    except Exception as e:
        logger.error(f"Error fetching HSN codes: {e}")
        return jsonify([]), 200

@app.route('/api/hsn-codes', methods=['POST'])
def add_hsn_code():
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    code = data.get('code', '').strip()
    description = data.get('description', '').strip()
    if not code:
        return jsonify({'error': 'HSN code is required'}), 400
    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO hsn_codes (code, description, created_at) VALUES (?, ?, ?)',
            (code, description, datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        hsn = db.execute('SELECT * FROM hsn_codes WHERE id = ?', (cursor.lastrowid,)).fetchone()
        return jsonify(dict(hsn)), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'HSN code already exists'}), 409
    except Exception as e:
        logger.error(f"Error adding HSN code: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# UNITS ENDPOINTS
@app.route('/api/units', methods=['GET'])
def get_units():
    db = get_db()
    try:
        units = db.execute('SELECT * FROM units ORDER BY name ASC').fetchall()
        return jsonify([dict(u) for u in units]), 200
    except Exception as e:
        logger.error(f"Error fetching units: {e}")
        return jsonify([]), 200

@app.route('/api/units', methods=['POST'])
def add_unit():
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    unit_name = data.get('name', '').strip()
    if not unit_name:
        return jsonify({'error': 'Unit name is required'}), 400
    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO units (name, created_at) VALUES (?, ?)',
            (unit_name, datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        unit = db.execute('SELECT * FROM units WHERE id = ?', (cursor.lastrowid,)).fetchone()
        return jsonify(dict(unit)), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Unit already exists'}), 409
    except Exception as e:
        logger.error(f"Error adding unit: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# COMPANIES ENDPOINTS
@app.route('/api/companies', methods=['GET'])
def get_companies():
    db = get_db()
    try:
        companies = db.execute('SELECT * FROM companies ORDER BY created_at DESC').fetchall()
        result = []
        for company in companies:
            company_dict = dict(company)
            partner_count = db.execute(
                'SELECT COUNT(*) as count FROM partners WHERE company_id = ?',
                (company['id'],)
            ).fetchone()
            company_dict['partnerCount'] = partner_count['count']
            result.append(company_dict)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error fetching companies: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/companies', methods=['POST'])
def create_company():
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    required = ['name', 'address', 'gst']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO companies (name, address, gst, created_at) VALUES (?, ?, ?, ?)',
            (data['name'].strip(), data['address'].strip(), data['gst'].strip(),
             datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        company = db.execute('SELECT * FROM companies WHERE id = ?', (cursor.lastrowid,)).fetchone()
        company_dict = dict(company)
        company_dict['partnerCount'] = 0
        return jsonify(company_dict), 201
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    db = get_db()
    try:
        company = db.execute('SELECT * FROM companies WHERE id = ?', (company_id,)).fetchone()
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        company_dict = dict(company)
        partners = db.execute('SELECT * FROM partners WHERE company_id = ?', (company_id,)).fetchall()
        company_dict['partners'] = [dict(p) for p in partners]
        return jsonify(company_dict), 200
    except Exception as e:
        logger.error(f"Error fetching company: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# PARTNERS ENDPOINTS
@app.route('/api/companies/<int:company_id>/partners', methods=['POST'])
def create_partner(company_id):
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    required = ['deliveryName', 'deliveryAddress', 'deliveryGst', 'billingName', 'billingAddress', 'billingGst']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400
    db = get_db()
    try:
        cursor = db.execute(
            '''INSERT INTO partners 
            (company_id, delivery_name, delivery_address, delivery_gst, delivery_state,
             billing_name, billing_address, billing_gst, billing_state, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (company_id,
             data['deliveryName'].strip(),
             data['deliveryAddress'].strip(),
             data['deliveryGst'].strip(),
             data.get('deliveryState', 'Tamil Nadu').strip(),
             data['billingName'].strip(),
             data['billingAddress'].strip(),
             data['billingGst'].strip(),
             data.get('billingState', 'Tamil Nadu').strip(),
             datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        partner = db.execute('SELECT * FROM partners WHERE id = ?', (cursor.lastrowid,)).fetchone()
        return jsonify(dict(partner)), 201
    except Exception as e:
        logger.error(f"Error creating partner: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/partners/<int:partner_id>', methods=['GET'])
def get_partner(partner_id):
    db = get_db()
    try:
        partner = db.execute('SELECT * FROM partners WHERE id = ?', (partner_id,)).fetchone()
        if not partner:
            return jsonify({'error': 'Partner not found'}), 404
        partner_dict = dict(partner)
        bills = db.execute(
            'SELECT * FROM bills WHERE partner_id = ? ORDER BY created_at DESC',
            (partner_id,)
        ).fetchall()
        bills_list = []
        for bill in bills:
            bill_dict = dict(bill)
            bill_dict['lineItems'] = json.loads(bill_dict['line_items'])
            bill_dict['amountInWords'] = number_to_words(int(bill_dict['grand_total']))
            del bill_dict['line_items']
            bills_list.append(bill_dict)
        partner_dict['bills'] = bills_list
        return jsonify(partner_dict), 200
    except Exception as e:
        logger.error(f"Error fetching partner: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# BILLS ENDPOINTS
@app.route('/api/partners/<int:partner_id>/bills', methods=['POST'])
def create_bill(partner_id):
    if not request.is_json:
        return jsonify({'error': 'Invalid or missing JSON body'}), 400
    data = request.get_json() or {}
    if not isinstance(data.get('lineItems'), list):
        return jsonify({'error': 'lineItems must be a list'}), 400
    if not data.get('dateOfSupply'):
        return jsonify({'error': 'dateOfSupply is required'}), 400
    line_items = data.get('lineItems', [])
    billing_method = data.get('billingMethod', 'method1')
    subtotal = 0

    try:
        if billing_method == 'method1':
            for item in line_items:
                qty = float(item['quantity'])
                price = float(item['price'])
                item_total = qty * price
                item['taxableValue'] = round(item_total, 2)
                subtotal += item_total
            cgst_rate = float(data.get('cgstRate', 9.0))
            sgst_rate = float(data.get('sgstRate', 9.0))
            cgst_amount = (subtotal * cgst_rate) / 100
            sgst_amount = (subtotal * sgst_rate) / 100
            total_gst = cgst_amount + sgst_amount
            grand_total = subtotal + total_gst
        else:
            cgst_amount = 0
            sgst_amount = 0
            for item in line_items:
                qty = float(item['quantity'])
                unit_price = float(item['unitPrice'])
                item_total = qty * unit_price
                gst_rate = float(item.get('gstRate', 5.0))
                item_gst = (item_total * gst_rate) / 100
                item['taxableValue'] = round(item_total, 2)
                item['gstAmount'] = round(item_gst, 2)
                item['total'] = round(item_total + item_gst, 2)
                subtotal += item_total
                cgst_amount += item_gst / 2
                sgst_amount += item_gst / 2
            total_gst = cgst_amount + sgst_amount
            grand_total = subtotal + total_gst
            cgst_rate = 0
            sgst_rate = 0
    except (KeyError, TypeError, ValueError) as e:
        return jsonify({'error': f'Invalid item data: {str(e)}'}), 400

    bill_number = data.get('billNumber', f"INV-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}")
    db = get_db()
    try:
        cursor = db.execute(
            '''INSERT INTO bills 
            (partner_id, bill_number, invoice_date, reverse_charge, po_number, po_date,
             state, state_code, vendor_code, transportation_mode, vehicle_number,
             date_of_supply, place_of_supply, billing_method, line_items, subtotal, cgst_rate, sgst_rate,
             cgst_amount, sgst_amount, total_gst, grand_total,
             bank_account_number, bank_name, bank_ifsc_code, bank_branch, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (partner_id, bill_number,
             data.get('invoiceDate', datetime.now(timezone.utc).date().isoformat()),
             data.get('reverseCharge', 'No'), data.get('poNumber'), data.get('poDate'),
             data.get('state', 'Tamil Nadu'), data.get('stateCode', '33'),
             data.get('vendorCode'), data.get('transportationMode', 'Road Ways'),
             data.get('vehicleNumber'), data.get('dateOfSupply'),
             data.get('placeOfSupply', 'Tamil Nadu'), billing_method,
             json.dumps(line_items), round(subtotal, 2), cgst_rate, sgst_rate,
             round(cgst_amount, 2), round(sgst_amount, 2), round(total_gst, 2),
             round(grand_total, 2),
             data.get('bankAccountNumber'), data.get('bankName'),
             data.get('bankIFSC'), data.get('bankBranch'),
             datetime.now(timezone.utc).isoformat())
        )
        db.commit()

        # Save autocomplete
        for field in ['vendorCode', 'vehicleNumber', 'poNumber', 'bankBranch', 'bankAccountNumber', 'bankName', 'bankIFSC']:
            if data.get(field):
                save_autocomplete(field.replace('IFSC', 'ifsc').replace('Number', 'number'), data[field], partner_id)

        bill = db.execute('SELECT * FROM bills WHERE id = ?', (cursor.lastrowid,)).fetchone()
        bill_dict = dict(bill)
        bill_dict['lineItems'] = json.loads(bill_dict['line_items'])
        bill_dict['amountInWords'] = number_to_words(int(grand_total))
        del bill_dict['line_items']
        return jsonify(bill_dict), 201
    except Exception as e:
        logger.error(f"Error creating bill: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/bills/<int:partner_id>', methods=['GET'])
def get_bills(partner_id):
    db = get_db()
    try:
        bills = db.execute(
            'SELECT * FROM bills WHERE partner_id = ? ORDER BY created_at DESC',
            (partner_id,)
        ).fetchall()
        bills_list = []
        for bill in bills:
            bill_dict = dict(bill)
            bill_dict['lineItems'] = json.loads(bill_dict['line_items'])
            del bill_dict['line_items']
            bills_list.append(bill_dict)
        return jsonify(bills_list), 200
    except Exception as e:
        logger.error(f"Error fetching bills: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# PDF DOWNLOAD
@app.route('/api/bills/<int:bill_id>/download', methods=['GET'])
def download_bill(bill_id):
    try:
        db = get_db()
        bill = db.execute('SELECT * FROM bills WHERE id = ?', (bill_id,)).fetchone()
        if not bill:
            return jsonify({'error': 'Bill not found'}), 404

        partner = db.execute('SELECT * FROM partners WHERE id = ?', (bill['partner_id'],)).fetchone()
        if not partner:
            return jsonify({'error': 'Partner not found'}), 404

        company = db.execute('SELECT * FROM companies WHERE id = ?', (partner['company_id'],)).fetchone()
        if not company:
            return jsonify({'error': 'Company not found'}), 404

        line_items = json.loads(bill['line_items'])
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=20, bottomMargin=30)
        elements = []
        styles = getSampleStyleSheet()

        # Styles
        company_style = ParagraphStyle('CompanyStyle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=3, leading=14, fontName='Helvetica-Bold')
        address_style = ParagraphStyle('AddressStyle', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, spaceAfter=2, leading=10, fontName='Helvetica')
        gst_style = ParagraphStyle('GSTStyle', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, spaceAfter=10, fontName='Helvetica-Bold')
        title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=15, fontName='Helvetica-Bold')

        elements.extend([
            Paragraph(company['name'].upper(), company_style),
            Paragraph(company['address'], address_style),
            Paragraph(f"GST IN: {company['gst']}", gst_style),
            Paragraph("TAX INVOICE", title_style),
            Spacer(1, 0.15*inch)
        ])

        # Invoice info table
        invoice_combined = [
            ['Reverse Charge', ':', bill['reverse_charge'], 'VENDOR CODE', ':', bill['vendor_code'] or ''],
            ['Invoice No', ':', bill['bill_number'], 'Transportation Mode', ':', bill['transportation_mode']],
            ['Invoice Date', ':', bill['invoice_date'], 'Vehicle No', ':', bill['vehicle_number'] or ''],
            ['P.O.No', ':', bill['po_number'] or '', 'Date of Supply', ':', bill['date_of_supply']],
            ['P.O.Date', ':', bill['po_date'] or '', 'Place of supply', ':', f"{bill['place_of_supply']} ({bill['state_code']})"],
            ['State', ':', bill['state'], 'State Code', ':', bill['state_code']],
        ]
        invoice_info_table = Table(invoice_combined, colWidths=[1.3*inch, 0.2*inch, 1.8*inch, 1.4*inch, 0.2*inch, 1.8*inch])
        invoice_info_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('BOX', (0, 0), (2, -1), 0.5, colors.black),
            ('BOX', (3, 0), (-1, -1), 0.5, colors.black),
            ('INNERGRID', (0, 0), (2, -1), 0.5, colors.black),
            ('INNERGRID', (3, 0), (-1, -1), 0.5, colors.black),
        ]))
        elements.extend([invoice_info_table, Spacer(1, 0.1*inch)])

        # Party details
        party_data = [
            ['Details Of Receiver | Billed to:', 'Details of Consignee | Shipped to:'],
            [
                f"Name: {partner['billing_name']}\nAddress: {partner['billing_address']}\nState: {partner['billing_state']}\nGST IN: {partner['billing_gst']}",
                f"Name: {partner['delivery_name']}\nAddress: {partner['delivery_address']}\nState: {partner['delivery_state']}\nGST IN: {partner['delivery_gst']}"
            ]
        ]
        party_table = Table(party_data, colWidths=[3.5*inch, 3.5*inch])
        party_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.extend([party_table, Spacer(1, 0.1*inch)])

        # Product table (Method 1 vs Method 2)
        if bill.get('billing_method') == 'method2':
            product_header = [['Sr.No', 'Product Description', 'HSN', 'QTY', 'Unit', 'Unit Price\nINR', 'Amount', 'GST\n%', 'GST\nAmount', 'Total']]
            for idx, item in enumerate(line_items, 1):
                product_header.append([
                    str(idx), item['description'], item.get('hsnCode', ''), str(item['quantity']),
                    item.get('unit', 'Nos'), f"{float(item['unitPrice']):.2f}", f"{item['taxableValue']}",
                    f"{float(item.get('gstRate', 5)):.1f}", f"{float(item.get('gstAmount', 0)):.2f}", f"{float(item.get('total', 0)):.2f}"
                ])
            product_header.append(['', 'Total', '', str(sum(float(item['quantity']) for item in line_items)), '', '', f"{bill['subtotal']:.2f}", '', f"{bill['total_gst']:.2f}", f"{bill['grand_total']:.2f}"])
            product_table = Table(product_header, colWidths=[0.35*inch, 1.5*inch, 0.5*inch, 0.4*inch, 0.4*inch, 0.7*inch, 0.7*inch, 0.4*inch, 0.6*inch, 0.7*inch])
        else:
            product_header = [['Sr.No', 'Product Description', 'QTY', 'Unit', 'Rate\nINR', 'Amount', 'Taxable\nValue', 'CGST\n%', 'CGST\nAmount', 'SGST\n%', 'SGST\nAmount', 'Total']]
            for idx, item in enumerate(line_items, 1):
                taxable = float(item['taxableValue'])
                cgst_for_item = (taxable * bill['cgst_rate']) / 100
                sgst_for_item = (taxable * bill['sgst_rate']) / 100
                item_total = taxable + cgst_for_item + sgst_for_item
                product_header.append([
                    str(idx), item['description'], str(item['quantity']), 'Nos',
                    f"{float(item['price']):.2f}", f"{taxable}", f"{taxable}",
                    f"{bill['cgst_rate']:.1f}", f"{cgst_for_item:.2f}",
                    f"{bill['sgst_rate']:.1f}", f"{sgst_for_item:.2f}", f"{item_total:.2f}"
                ])
            product_header.append(['', 'Total', str(sum(float(item['quantity']) for item in line_items)), '', '', f"{bill['subtotal']:.2f}", f"{bill['subtotal']:.2f}", '', f"{bill['cgst_amount']:.2f}", '', f"{bill['sgst_amount']:.2f}", f"{bill['grand_total']:.2f}"])
            product_table = Table(product_header, colWidths=[0.35*inch, 1.8*inch, 0.35*inch, 0.35*inch, 0,
                    0.5*inch, 0.6*inch, 0.6*inch, 0.4*inch, 0.5*inch, 0.4*inch, 0.5*inch, 0.6*inch
                ])
        
        product_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -2), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 2),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.extend([product_table, Spacer(1, 0.1*inch)])

        # Amount in words
        amount_in_words_data = [[f"Amount Chargeable (in words):  {number_to_words(int(bill['grand_total']))}"]]
        amount_words_table = Table(amount_in_words_data, colWidths=[7*inch])
        amount_words_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.extend([amount_words_table, Spacer(1, 0.1*inch)])

        # Bank details
        if bill['bank_account_number']:
            bank_data = [
                ['Bank Details:'],
                [f"A/c No: {bill['bank_account_number']}    Bank Name: {bill['bank_name']}    IFSC: {bill['bank_ifsc_code']}    Branch: {bill['bank_branch']}"]
            ]
            bank_table = Table(bank_data, colWidths=[7*inch])
            bank_table.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.extend([bank_table, Spacer(1, 0.1*inch)])

        # Signature
        signature_data = [
            ['', 'Certified that the particulars given above are true and correct'],
            ['', f"for {company['name'].upper()}"],
            ['', ''],
            ['', ''],
        ]
        signature_table = Table(signature_data, colWidths=[4.5*inch, 2.5*inch])
        signature_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica'),
            ('FONTNAME', (1, 1), (1, 1), 'Helvetica-Bold'),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('VALIGN', (1, 0), (1, -1), 'MIDDLE'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ]))
        elements.extend([signature_table, Spacer(1, 0.1*inch)])

        # Terms
        terms_data = [
            ['Terms and Conditions:'],
            ['1. This is electronically generated invoice.'],
            ['2. All disputes are subject to Tiruvallur jurisdiction.'],
            ['3. Please pay invoice within 30 days.']
        ]
        terms_table = Table(terms_data, colWidths=[7*inch])
        terms_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(terms_table)

        doc.build(elements)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"invoice_{bill['bill_number']}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        logger.error(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to generate PDF'}), 500

def init_default_products():
    """Initialize default product descriptions"""
    default_products = [
        'LIZOL DFC', 'HARPIC BLUE 500ML', 'MOPSTICK CLIP&FITT', 'CHECKED CLOTH',
        'PHENOYL COMPOUND 1ST GRADE', 'ROOM SPRAY', 'FEM HANDWASH 5LTR', 'ROOM FRESHNER',
        'EASYMOP WITH STICK', 'GOGGLES WHITE', 'AG4 CUTTING WHEEL 2MM',
        'PU TROLLY WHEEL W/O BRACKET 6"*2" RED', 'A3 LAMINATION SHEET(125 MIC)',
        'PAINT MARKER(YELLOW)', 'PAINT MARKER(WHITE)', 'A4 LAMINATION SHEET(125 MIC)',
        'WHITE BOARD MARKER BLUE', 'WHITE BOARD MARKER BLACK', 'LONG SIXE NOTEBOOK RULED',
        'STICK NOTE PAD HX-A35', '5 LEVER LOCK', 'LABLE GUN STICKER'
    ]
    with app.app_context():
        db = get_db()
        for product in default_products:
            try:
                db.execute(
                    'INSERT OR IGNORE INTO product_descriptions (name, created_at) VALUES (?, ?)',
                    (product, datetime.now(timezone.utc).isoformat())
                )
            except Exception as e:
                logger.error(f"Error adding product {product}: {e}")
        db.commit()
        logger.info(f"✓ Initialized {len(default_products)} default products")

def init_default_hsn_and_units():
    """Initialize default HSN codes and units"""
    default_hsn = [
        ('3402', 'Cleaning preparations'), ('3307', 'Perfumes and toilet preparations'),
        ('3926', 'Articles of plastics'), ('6307', 'Textile products'),
        ('9603', 'Brooms and brushes'), ('4823', 'Paper and paperboard'),
        ('6815', 'Articles of stone'), ('8201', 'Hand tools'),
        ('8302', 'Base metal mountings'), ('8716', 'Wheels and castors')
    ]
    default_units = ['Nos', 'Pcs', 'Box', 'Pkt', 'Ltr', 'Kg', 'Mtr', 'Set', 'Roll', 'Doz']
    
    with app.app_context():
        db = get_db()
        for code, desc in default_hsn:
            try:
                db.execute(
                    'INSERT OR IGNORE INTO hsn_codes (code, description, created_at) VALUES (?, ?, ?)',
                    (code, desc, datetime.now(timezone.utc).isoformat())
                )
            except Exception as e:
                logger.error(f"Error adding HSN {code}: {e}")
        for unit in default_units:
            try:
                db.execute(
                    'INSERT OR IGNORE INTO units (name, created_at) VALUES (?, ?)',
                    (unit, datetime.now(timezone.utc).isoformat())
                )
            except Exception as e:
                logger.error(f"Error adding unit {unit}: {e}")
        db.commit()
        logger.info(f"✓ Initialized {len(default_hsn)} HSN codes and {len(default_units)} units")

# Initialize everything on startup
with app.app_context():
    logger.info("🔄 Initializing database...")
    init_db()
    migrate_db()
    init_default_products()
    init_default_hsn_and_units()
    logger.info("✓ All initialization complete")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
