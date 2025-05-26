from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db
from models.category import Category
from models.brand import Brand

categories_bp = Blueprint('categories', __name__)

# --------- CATEGORIES --------- #

@categories_bp.route('/categories', methods=['GET'])
@jwt_required()
def list_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@categories_bp.route('/categories', methods=['POST'])
@jwt_required()
def add_category():
    data = request.get_json()
    category = Category(name=data['name'], description=data.get('description', ''))
    db.session.add(category)
    db.session.commit()
    return jsonify({'message': 'Category added'}), 201

@categories_bp.route('/categories/<int:id>', methods=['PUT'])
@jwt_required()
def update_category(id):
    data = request.get_json()
    category = Category.query.get_or_404(id)
    category.name = data.get('name', category.name)
    category.description = data.get('description', category.description)
    db.session.commit()
    return jsonify({'message': 'Category updated'}), 200

@categories_bp.route('/categories/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category(id):
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted'}), 200

# --------- BRANDS --------- #

@categories_bp.route('/brands', methods=['GET'])
@jwt_required()
def list_brands():
    brands = Brand.query.all()
    return jsonify([b.to_dict() for b in brands]), 200

@categories_bp.route('/brands', methods=['POST'])
@jwt_required()
def add_brand():
    data = request.get_json()
    brand = Brand(name=data['name'], country=data.get('country', ''))
    db.session.add(brand)
    db.session.commit()
    return jsonify({'message': 'Brand added'}), 201

@categories_bp.route('/brands/<int:id>', methods=['PUT'])
@jwt_required()
def update_brand(id):
    data = request.get_json()
    brand = Brand.query.get_or_404(id)
    brand.name = data.get('name', brand.name)
    brand.country = data.get('country', brand.country)
    db.session.commit()
    return jsonify({'message': 'Brand updated'}), 200

@categories_bp.route('/brands/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_brand(id):
    brand = Brand.query.get_or_404(id)
    db.session.delete(brand)
    db.session.commit()
    return jsonify({'message': 'Brand deleted'}), 200
