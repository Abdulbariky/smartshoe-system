from app import create_app
from models import db
from models.user import User
from models.product import Product

app = create_app('development')

with app.app_context():
    # Create all tables
    db.create_all()
    print("✅ Database tables created!")
    
    # Create admin user if not exists
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@smartshoe.com',
            role='admin'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created (username: admin, password: admin123)")
    
    # Add sample products if none exist
    if Product.query.count() == 0:
        sample_products = [
            {
                'name': 'Nike Air Max 270',
                'brand': 'Nike',
                'category': 'Sneakers',
                'size': '42',
                'color': 'Black/White',
                'purchase_price': 8500,
                'retail_price': 12000,
                'wholesale_price': 10500,
                'supplier': 'Nike Kenya',
                'sku': 'NK-SNE-001'
            },
            {
                'name': 'Adidas Ultraboost 22',
                'brand': 'Adidas',
                'category': 'Running',
                'size': '43',
                'color': 'Navy Blue',
                'purchase_price': 9000,
                'retail_price': 14000,
                'wholesale_price': 12000,
                'supplier': 'Adidas Distributors',
                'sku': 'AD-RUN-001'
            }
        ]
        
        for product_data in sample_products:
            product = Product(**product_data)
            db.session.add(product)
        
        db.session.commit()
        print("✅ Sample products added!")