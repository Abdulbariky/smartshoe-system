from . import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    size = db.Column(db.String(20), nullable=False)
    color = db.Column(db.String(30), nullable=False)
    purchase_price = db.Column(db.Float, nullable=False)
    retail_price = db.Column(db.Float, nullable=False)
    wholesale_price = db.Column(db.Float, nullable=False)
    supplier = db.Column(db.String(100))
    sku = db.Column(db.String(50), unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'size': self.size,
            'color': self.color,
            'purchase_price': self.purchase_price,
            'retail_price': self.retail_price,
            'wholesale_price': self.wholesale_price,
            'sku': self.sku,
            'current_stock': self.get_current_stock()
        }
    
    def get_current_stock(self):
        from .inventory import InventoryItem
        total_in = sum(item.quantity for item in InventoryItem.query.filter_by(product_id=self.id, transaction_type='in').all())
        total_out = sum(item.quantity for item in InventoryItem.query.filter_by(product_id=self.id, transaction_type='out').all())
        return total_in - total_out