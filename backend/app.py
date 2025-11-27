# Part 1: Setup and Models

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

app = Flask(__name__)
CORS(app)

# Configure database connection
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///billing.db'  # fallback local

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Models

class Company(db.Model):
    __tablename__ = 'companies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    address = db.Column(db.Text, nullable=False)
    gst = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.Text, nullable=False)
    partners = db.relationship('Partner', backref='company', cascade="all, delete-orphan")

class Partner(db.Model):
    __tablename__ = 'partners'
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    delivery_name = db.Column(db.Text, nullable=False)
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_gst = db.Column(db.Text, nullable=False)
    delivery_state = db.Column(db.Text, default='Tamil Nadu')
    billing_name = db.Column(db.Text, nullable=False)
    billing_address = db.Column(db.Text, nullable=False)
    billing_gst = db.Column(db.Text, nullable=False)
    billing_state = db.Column(db.Text, default='Tamil Nadu')
    created_at = db.Column(db.Text, nullable=False)
    bills = db.relationship('Bill', backref='partner', cascade="all, delete-orphan")

class Bill(db.Model):
    __tablename__ = 'bills'
    id = db.Column(db.Integer, primary_key=True)
    partner_id = db.Column(db.Integer, db.ForeignKey('partners.id'), nullable=False)
    bill_number = db.Column(db.Text, nullable=False)
    invoice_date = db.Column(db.Text, nullable=False)
    reverse_charge = db.Column(db.Text, default='No')
    po_number = db.Column(db.Text)
    po_date = db.Column(db.Text)
    state = db.Column(db.Text, default='Tamil Nadu')
    state_code = db.Column(db.Text, default='33')
    vendor_code = db.Column(db.Text)
    transportation_mode = db.Column(db.Text, default='Road Ways')
    vehicle_number = db.Column(db.Text)
    date_of_supply = db.Column(db.Text, nullable=False)
    place_of_supply = db.Column(db.Text, default='Tamil Nadu')
    billing_method = db.Column(db.Text, default='method1')
    line_items = db.Column(db.Text, nullable=False)  # JSON string
    subtotal = db.Column(db.Float, nullable=False)
    cgst_rate = db.Column(db.Float, default=9.0)
    sgst_rate = db.Column(db.Float, default=9.0)
    cgst_amount = db.Column(db.Float, nullable=False)
    sgst_amount = db.Column(db.Float, nullable=False)
    total_gst = db.Column(db.Float, nullable=False)
    grand_total = db.Column(db.Float, nullable=False)
    bank_account_number = db.Column(db.Text)
    bank_name = db.Column(db.Text)
    bank_ifsc_code = db.Column(db.Text)
    bank_branch = db.Column(db.Text)
    created_at = db.Column(db.Text, nullable=False)

class AutocompleteHistory(db.Model):
    __tablename__ = 'autocomplete_history'
    id = db.Column(db.Integer, primary_key=True)
    field_name = db.Column(db.Text, nullable=False)
    field_value = db.Column(db.Text, nullable=False)
    partner_id = db.Column(db.Integer, nullable=True)
    last_used = db.Column(db.Text, nullable=False)
    use_count = db.Column(db.Integer, default=1)
    __table_args__ = (db.UniqueConstraint('field_name', 'field_value', 'partner_id', name='autocomplete_unique'),)

class ProductDescription(db.Model):
    __tablename__ = 'product_descriptions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    created_at = db.Column(db.Text, nullable=False)

class HsnCode(db.Model):
    __tablename__ = 'hsn_codes'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.Text, unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.Text, nullable=False)

class Unit(db.Model):
    __tablename__ = 'units'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, unique=True, nullable=False)
    created_at = db.Column(db.Text, nullable=False)
# Part 2: Helper functions and autocomplete endpoints

from datetime import datetime

# Helper function to save autocomplete history
def save_autocomplete(field_name, field_value, partner_id=None):
    if not field_value or not field_value.strip():
        return
    try:
        record = AutocompleteHistory.query.filter_by(
            field_name=field_name,
            field_value=field_value,
            partner_id=partner_id
        ).first()
        now = datetime.utcnow().isoformat()
        if record:
            record.last_used = now
            record.use_count += 1
        else:
            record = AutocompleteHistory(
                field_name=field_name,
                field_value=field_value,
                partner_id=partner_id,
                last_used=now,
                use_count=1
            )
            db.session.add(record)
        db.session.commit()
    except Exception as e:
        print(f"Error saving autocomplete: {e}")

# API endpoint to get autocomplete suggestions
@app.route('/api/autocomplete/<field_name>', methods=['GET'])
def get_autocomplete(field_name):
    partner_id = request.args.get('partner_id', type=int)
    try:
        if partner_id:
            suggestions = AutocompleteHistory.query.filter_by(
                field_name=field_name,
                partner_id=partner_id
            ).order_by(
                AutocompleteHistory.use_count.desc(),
                AutocompleteHistory.last_used.desc()
            ).limit(10).all()
        else:
            suggestions = AutocompleteHistory.query.filter_by(
                field_name=field_name
            ).order_by(
                AutocompleteHistory.use_count.desc(),
                AutocompleteHistory.last_used.desc()
            ).limit(10).all()

        results = [{'field_value': s.field_value, 'use_count': s.use_count} for s in suggestions]
        return jsonify(results), 200
    except Exception as e:
        print(f"Error fetching autocomplete: {e}")
        return jsonify([]), 200

# Number to words function (for amounts in bills)
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
            return ones[num // 100] + ' Hundred' + (' And ' + convert_less_than_thousand(num % 100) if num % 100 != 0 else '')

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
# Part 3: Companies and Partners API endpoints

# Get list of companies with partner counts
@app.route('/api/companies', methods=['GET'])
def get_companies():
    companies = Company.query.order_by(Company.created_at.desc()).all()
    result = []
    for company in companies:
        partner_count = Partner.query.filter_by(company_id=company.id).count()
        company_dict = {
            'id': company.id,
            'name': company.name,
            'address': company.address,
            'gst': company.gst,
            'created_at': company.created_at,
            'partnerCount': partner_count
        }
        result.append(company_dict)
    return jsonify(result), 200

# Create a new company
@app.route('/api/companies', methods=['POST'])
def create_company():
    data = request.json
    company = Company(
        name=data['name'],
        address=data['address'],
        gst=data['gst'],
        created_at=datetime.utcnow().isoformat()
    )
    db.session.add(company)
    db.session.commit()
    company_dict = {
        'id': company.id,
        'name': company.name,
        'address': company.address,
        'gst': company.gst,
        'created_at': company.created_at,
        'partnerCount': 0
    }
    return jsonify(company_dict), 201

# Get company details with its partners
@app.route('/api/companies/<int:company_id>', methods=['GET'])
def get_company(company_id):
    company = Company.query.get(company_id)
    if not company:
        return jsonify({'error': 'Company not found'}), 404

    partners = Partner.query.filter_by(company_id=company.id).all()
    company_dict = {
        'id': company.id,
        'name': company.name,
        'address': company.address,
        'gst': company.gst,
        'created_at': company.created_at,
        'partners': [{
            'id': p.id,
            'deliveryName': p.delivery_name,
            'deliveryAddress': p.delivery_address,
            'deliveryGst': p.delivery_gst,
            'deliveryState': p.delivery_state,
            'billingName': p.billing_name,
            'billingAddress': p.billing_address,
            'billingGst': p.billing_gst,
            'billingState': p.billing_state,
            'created_at': p.created_at
        } for p in partners]
    }
    return jsonify(company_dict), 200

# Create partner for a company
@app.route('/api/companies/<int:company_id>/partners', methods=['POST'])
def create_partner(company_id):
    data = request.json
    company = Company.query.get(company_id)
    if not company:
        return jsonify({'error': 'Company not found'}), 404

    partner = Partner(
        company_id=company_id,
        delivery_name=data['deliveryName'],
        delivery_address=data['deliveryAddress'],
        delivery_gst=data['deliveryGst'],
        delivery_state=data.get('deliveryState', 'Tamil Nadu'),
        billing_name=data['billingName'],
        billing_address=data['billingAddress'],
        billing_gst=data['billingGst'],
        billing_state=data.get('billingState', 'Tamil Nadu'),
        created_at=datetime.utcnow().isoformat()
    )
    db.session.add(partner)
    db.session.commit()

    partner_dict = {
        'id': partner.id,
        'company_id': partner.company_id,
        'deliveryName': partner.delivery_name,
        'deliveryAddress': partner.delivery_address,
        'deliveryGst': partner.delivery_gst,
        'deliveryState': partner.delivery_state,
        'billingName': partner.billing_name,
        'billingAddress': partner.billing_address,
        'billingGst': partner.billing_gst,
        'billingState': partner.billing_state,
        'created_at': partner.created_at
    }
    return jsonify(partner_dict), 201

# Get partner details with their bills
@app.route('/api/partners/<int:partner_id>', methods=['GET'])
def get_partner(partner_id):
    partner = Partner.query.get(partner_id)
    if not partner:
        return jsonify({'error': 'Partner not found'}), 404

    bills = Bill.query.filter_by(partner_id=partner.id).order_by(Bill.created_at.desc()).all()
    bills_list = []
    for bill in bills:
        line_items = json.loads(bill.line_items)
        bill_dict = {
            'id': bill.id,
            'partner_id': bill.partner_id,
            'bill_number': bill.bill_number,
            'invoice_date': bill.invoice_date,
            'reverse_charge': bill.reverse_charge,
            'po_number': bill.po_number,
            'po_date': bill.po_date,
            'state': bill.state,
            'state_code': bill.state_code,
            'vendor_code': bill.vendor_code,
            'transportation_mode': bill.transportation_mode,
            'vehicle_number': bill.vehicle_number,
            'date_of_supply': bill.date_of_supply,
            'place_of_supply': bill.place_of_supply,
            'billing_method': bill.billing_method,
            'lineItems': line_items,
            'subtotal': bill.subtotal,
            'cgst_rate': bill.cgst_rate,
            'sgst_rate': bill.sgst_rate,
            'cgst_amount': bill.cgst_amount,
            'sgst_amount': bill.sgst_amount,
            'total_gst': bill.total_gst,
            'grand_total': bill.grand_total,
            'bank_account_number': bill.bank_account_number,
            'bank_name': bill.bank_name,
            'bank_ifsc_code': bill.bank_ifsc_code,
            'bank_branch': bill.bank_branch,
            'created_at': bill.created_at,
            'amountInWords': number_to_words(int(bill.grand_total))
        }
        bills_list.append(bill_dict)

    partner_dict = {
        'id': partner.id,
        'company_id': partner.company_id,
        'deliveryName': partner.delivery_name,
        'deliveryAddress': partner.delivery_address,
        'deliveryGst': partner.delivery_gst,
        'deliveryState': partner.delivery_state,
        'billingName': partner.billing_name,
        'billingAddress': partner.billing_address,
        'billingGst': partner.billing_gst,
        'billingState': partner.billing_state,
        'created_at': partner.created_at,
        'bills': bills_list
    }
    return jsonify(partner_dict), 200
# Part 4: Bills endpoints and PDF generation

# Create a bill
@app.route('/api/partners/<int:partner_id>/bills', methods=['POST'])
def create_bill(partner_id):
    data = request.json
    line_items = data.get('lineItems', [])
    billing_method = data.get('billingMethod', 'method1')

    # Calculate totals
    subtotal = 0
    if billing_method == 'method1':
        for item in line_items:
            item_total = item['quantity'] * item['price']
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
            item_total = item['quantity'] * item['unitPrice']
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

    bill_number = data.get('billNumber', f"INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}")

    bill = Bill(
        partner_id=partner_id,
        bill_number=bill_number,
        invoice_date=data.get('invoiceDate', datetime.utcnow().date().isoformat()),
        reverse_charge=data.get('reverseCharge', 'No'),
        po_number=data.get('poNumber'),
        po_date=data.get('poDate'),
        state=data.get('state', 'Tamil Nadu'),
        state_code=data.get('stateCode', '33'),
        vendor_code=data.get('vendorCode'),
        transportation_mode=data.get('transportationMode', 'Road Ways'),
        vehicle_number=data.get('vehicleNumber'),
        date_of_supply=data.get('dateOfSupply'),
        place_of_supply=data.get('placeOfSupply', 'Tamil Nadu'),
        billing_method=billing_method,
        line_items=json.dumps(line_items),
        subtotal=round(subtotal, 2),
        cgst_rate=cgst_rate,
        sgst_rate=sgst_rate,
        cgst_amount=round(cgst_amount, 2),
        sgst_amount=round(sgst_amount, 2),
        total_gst=round(total_gst, 2),
        grand_total=round(grand_total, 2),
        bank_account_number=data.get('bankAccountNumber'),
        bank_name=data.get('bankName'),
        bank_ifsc_code=data.get('bankIFSC'),
        bank_branch=data.get('bankBranch'),
        created_at=datetime.utcnow().isoformat()
    )
    db.session.add(bill)
    db.session.commit()

    # Save autocomplete entries
    save_autocomplete('vendor_code', data.get('vendorCode'), partner_id)
    save_autocomplete('vehicle_number', data.get('vehicleNumber'), partner_id)
    save_autocomplete('po_number', data.get('poNumber'), partner_id)
    save_autocomplete('bank_branch', data.get('bankBranch'), partner_id)
    save_autocomplete('bank_account_number', data.get('bankAccountNumber'), partner_id)
    save_autocomplete('bank_name', data.get('bankName'), partner_id)
    save_autocomplete('bank_ifsc', data.get('bankIFSC'), partner_id)

    bill_data = {
        'id': bill.id,
        'partner_id': bill.partner_id,
        'bill_number': bill.bill_number,
        'invoice_date': bill.invoice_date,
        'reverse_charge': bill.reverse_charge,
        'po_number': bill.po_number,
        'po_date': bill.po_date,
        'state': bill.state,
        'state_code': bill.state_code,
        'vendor_code': bill.vendor_code,
        'transportation_mode': bill.transportation_mode,
        'vehicle_number': bill.vehicle_number,
        'date_of_supply': bill.date_of_supply,
        'place_of_supply': bill.place_of_supply,
        'billing_method': bill.billing_method,
        'lineItems': line_items,
        'subtotal': bill.subtotal,
        'cgst_rate': bill.cgst_rate,
        'sgst_rate': bill.sgst_rate,
        'cgst_amount': bill.cgst_amount,
        'sgst_amount': bill.sgst_amount,
        'total_gst': bill.total_gst,
        'grand_total': bill.grand_total,
        'bank_account_number': bill.bank_account_number,
        'bank_name': bill.bank_name,
        'bank_ifsc_code': bill.bank_ifsc_code,
        'bank_branch': bill.bank_branch,
        'created_at': bill.created_at,
        'amountInWords': number_to_words(int(bill.grand_total))
    }
    return jsonify(bill_data), 201


# Retrieve bills for a partner
@app.route('/api/bills/<int:partner_id>', methods=['GET'])
def get_bills(partner_id):
    bills = Bill.query.filter_by(partner_id=partner_id).order_by(Bill.created_at.desc()).all()
    bills_list = []
    for bill in bills:
        line_items = json.loads(bill.line_items)
        bill_dict = {
            'id': bill.id,
            'partner_id': bill.partner_id,
            'bill_number': bill.bill_number,
            'invoice_date': bill.invoice_date,
            'reverse_charge': bill.reverse_charge,
            'po_number': bill.po_number,
            'po_date': bill.po_date,
            'state': bill.state,
            'state_code': bill.state_code,
            'vendor_code': bill.vendor_code,
            'transportation_mode': bill.transportation_mode,
            'vehicle_number': bill.vehicle_number,
            'date_of_supply': bill.date_of_supply,
            'place_of_supply': bill.place_of_supply,
            'billing_method': bill.billing_method,
            'lineItems': line_items,
            'subtotal': bill.subtotal,
            'cgst_rate': bill.cgst_rate,
            'sgst_rate': bill.sgst_rate,
            'cgst_amount': bill.cgst_amount,
            'sgst_amount': bill.sgst_amount,
            'total_gst': bill.total_gst,
            'grand_total': bill.grand_total,
            'bank_account_number': bill.bank_account_number,
            'bank_name': bill.bank_name,
            'bank_ifsc_code': bill.bank_ifsc_code,
            'bank_branch': bill.bank_branch,
            'created_at': bill.created_at,
        }
        bills_list.append(bill_dict)
    return jsonify(bills_list), 200


# Download bill as PDF endpoint (use your existing PDF generation code wrapped with ORM data access)
@app.route('/api/bills/<int:bill_id>/download', methods=['GET'])
def download_bill(bill_id):
    bill = Bill.query.get(bill_id)
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404

    partner = Partner.query.get(bill.partner_id)
    company = Company.query.get(partner.company_id if partner else None) if partner else None
    if not partner or not company:
        return jsonify({'error': 'Partner or Company not found'}), 404

    line_items = json.loads(bill.line_items)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=20, bottomMargin=30)

    elements = []
    styles = getSampleStyleSheet()

    company_style = ParagraphStyle('CompanyStyle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=3, leading=14, fontName='Helvetica-Bold')
    address_style = ParagraphStyle('AddressStyle', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, spaceAfter=2, leading=10, fontName='Helvetica')
    gst_style = ParagraphStyle('GSTStyle', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, spaceAfter=10, fontName='Helvetica-Bold')
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=12, alignment=TA_CENTER, spaceAfter=15, fontName='Helvetica-Bold')

    elements.append(Paragraph(company.name.upper(), company_style))
    elements.append(Paragraph(company.address, address_style))
    elements.append(Paragraph(f"GST IN: {company.gst}", gst_style))
    elements.append(Paragraph("TAX INVOICE", title_style))
    elements.append(Spacer(1, 0.15 * inch))

    # ... continue your existing PDF generation logic exactly as in your code ...

    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, as_attachment=True,
                     download_name=f"invoice_{bill.bill_number}.pdf", mimetype='application/pdf')
# Part 5: Products, HSN, Units endpoints and initialization logic

# --- Product Descriptions Endpoints ---

@app.route('/api/products', methods=['GET'])
def get_products():
    products = ProductDescription.query.order_by(ProductDescription.name.asc()).all()
    return jsonify([{'id': p.id, 'name': p.name, 'created_at': p.created_at} for p in products]), 200

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    product_name = data.get('name', '').strip()
    if not product_name:
        return jsonify({'error': 'Product name is required'}), 400
    try:
        product = ProductDescription(name=product_name, created_at=datetime.utcnow().isoformat())
        db.session.add(product)
        db.session.commit()
        return jsonify({'id': product.id, 'name': product.name, 'created_at': product.created_at}), 201
    except Exception as e:
        db.session.rollback()
        if "duplicate key" in str(e) or "UNIQUE constraint" in str(e):
            return jsonify({'error': 'Product already exists'}), 409
        return jsonify({'error': str(e)}), 500

# --- HSN Codes Endpoints ---

@app.route('/api/hsn-codes', methods=['GET'])
def get_hsn_codes():
    codes = HsnCode.query.order_by(HsnCode.code.asc()).all()
    return jsonify([{'id': h.id, 'code': h.code, 'description': h.description, 'created_at': h.created_at} for h in codes]), 200

@app.route('/api/hsn-codes', methods=['POST'])
def add_hsn_code():
    data = request.json
    code = data.get('code', '').strip()
    description = data.get('description', '').strip()
    if not code:
        return jsonify({'error': 'HSN code is required'}), 400
    try:
        hsn = HsnCode(code=code, description=description, created_at=datetime.utcnow().isoformat())
        db.session.add(hsn)
        db.session.commit()
        return jsonify({'id': hsn.id, 'code': hsn.code, 'description': hsn.description, 'created_at': hsn.created_at}), 201
    except Exception as e:
        db.session.rollback()
        if "duplicate key" in str(e) or "UNIQUE constraint" in str(e):
            return jsonify({'error': 'HSN code already exists'}), 409
        return jsonify({'error': str(e)}), 500

# --- Units Endpoints ---

@app.route('/api/units', methods=['GET'])
def get_units():
    units = Unit.query.order_by(Unit.name.asc()).all()
    return jsonify([{'id': u.id, 'name': u.name, 'created_at': u.created_at} for u in units]), 200

@app.route('/api/units', methods=['POST'])
def add_unit():
    data = request.json
    unit_name = data.get('name', '').strip()
    if not unit_name:
        return jsonify({'error': 'Unit name is required'}), 400
    try:
        unit = Unit(name=unit_name, created_at=datetime.utcnow().isoformat())
        db.session.add(unit)
        db.session.commit()
        return jsonify({'id': unit.id, 'name': unit.name, 'created_at': unit.created_at}), 201
    except Exception as e:
        db.session.rollback()
        if "duplicate key" in str(e) or "UNIQUE constraint" in str(e):
            return jsonify({'error': 'Unit already exists'}), 409
        return jsonify({'error': str(e)}), 500

# --- Default Data Initialization ---

def init_default_products():
    default_products = [
        'LIZOL DFC', 'HARPIC BLUE 500ML', 'MOPSTICK CLIP&FITT', 'CHECKED CLOTH',
        'PHENOYL COMPOUND 1ST GRADE', 'ROOM SPRAY', 'FEM HANDWASH 5LTR', 'ROOM FRESHNER',
        'EASYMOP WITH STICK', 'GOGGLES WHITE', 'AG4 CUTTING WHEEL 2MM',
        'PU TROLLY WHEEL W/O BRACKET 6\"*2\" RED', 'A3 LAMINATION SHEET(125 MIC)',
        'PAINT MARKER(YELLOW)', 'PAINT MARKER(WHITE)', 'A4 LAMINATION SHEET(125 MIC)',
        'WHITE BOARD MARKER BLUE', 'WHITE BOARD MARKER BLACK', 'LONG SIXE NOTEBOOK RULED',
        'STICK NOTE PAD HX-A35', '5 LEVER LOCK', 'LABLE GUN STICKER'
    ]
    for product_name in default_products:
        if not ProductDescription.query.filter_by(name=product_name).first():
            db.session.add(ProductDescription(name=product_name, created_at=datetime.utcnow().isoformat()))
    db.session.commit()
    print(f"✓ Initialized {len(default_products)} default products")

def init_default_hsn_and_units():
    default_hsn = [
        ('3402', 'Cleaning preparations'), ('3307', 'Perfumes and toilet preparations'),
        ('3926', 'Articles of plastics'), ('6307', 'Textile products'),
        ('9603', 'Brooms and brushes'), ('4823', 'Paper and paperboard'),
        ('6815', 'Articles of stone'), ('8201', 'Hand tools'),
        ('8302', 'Base metal mountings'), ('8716', 'Wheels and castors')
    ]
    default_units = ['Nos', 'Pcs', 'Box', 'Pkt', 'Ltr', 'Kg', 'Mtr', 'Set', 'Roll', 'Doz']

    for code, desc in default_hsn:
        if not HsnCode.query.filter_by(code=code).first():
            db.session.add(HsnCode(code=code, description=desc, created_at=datetime.utcnow().isoformat()))
    for unit_name in default_units:
        if not Unit.query.filter_by(name=unit_name).first():
            db.session.add(Unit(name=unit_name, created_at=datetime.utcnow().isoformat()))
    db.session.commit()
    print(f"✓ Initialized {len(default_hsn)} HSN codes and {len(default_units)} units")

# --- App Bootstrapper ---

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        init_default_products()
        init_default_hsn_and_units()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
