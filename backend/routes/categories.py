from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import db

categories_bp = Blueprint('categories', __name__)

# Simple in-memory storage for now (in production, create database models)
categories = [
    {"id": 1, "name": "Sneakers", "description": "Sports and casual sneakers"},
    {"id": 2, "name": "Running", "description": "Professional running shoes"},
    {"id": 3, "name": "Formal", "description": "Office and formal shoes"},
    {"id": 4, "name": "Casual", "description": "Everyday casual shoes"},
    {"id": 5, "name": "Sandals", "description": "Open-toe sandals"},
    {"id": 6, "name": "Kids", "description": "Children's shoes"},
]

brands = [
    {"id": 1, "name": "Nike", "country": "USA"},
    {"id": 2, "name": "Adidas", "country": "Germany"},
    {"id": 3, "name": "Puma", "country": "Germany"},
    {"id": 4, "name": "Clarks", "country": "UK"},
    {"id": 5, "name": "Bata", "country": "Switzerland"},
]

@categories_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    return jsonify({"categories": categories}), 200

@categories_bp.route('/categories', methods=['POST'])
@jwt_required()
def add_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Category name is required'}), 400
    
    new_category = {
        "id": len(categories) + 1,
        "name": data['name'],
        "description": data.get('description', '')
    }
    categories.append(new_category)
    return jsonify({"category": new_category}), 201

@categories_bp.route('/brands', methods=['GET'])
@jwt_required()
def get_brands():
    return jsonify({"brands": brands}), 200

@categories_bp.route('/brands', methods=['POST'])
@jwt_required()
def add_brand():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'message': 'Brand name is required'}), 400
    
    new_brand = {
        "id": len(brands) + 1,
        "name": data['name'],
        "country": data.get('country', '')
    }
    brands.append(new_brand)
    return jsonify({"brand": new_brand}), 201