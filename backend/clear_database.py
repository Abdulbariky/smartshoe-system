#!/usr/bin/env python3
"""
SmartShoe Database Reset Script
This script will clear ALL data from your database and recreate tables.
USE WITH CAUTION - ALL DATA WILL BE LOST!
"""

import os
import sys
from app import create_app
from models import db
from models.user import User
from models.product import Product
from models.inventory import InventoryItem
from models.sale import Sale, SaleItem
from models.category import Category
from models.brand import Brand

def clear_all_data():
    """Clear all data from all tables"""
    print("🗑️  Starting database cleanup...")
    
    try:
        # Delete in correct order (relationships matter)
        print("📦 Clearing sales data...")
        SaleItem.query.delete()
        Sale.query.delete()
        
        print("📦 Clearing inventory data...")
        InventoryItem.query.delete()
        
        print("📦 Clearing products...")
        Product.query.delete()
        
        print("📦 Clearing categories...")
        Category.query.delete()
        
        print("📦 Clearing brands...")
        Brand.query.delete()
        
        print("📦 Clearing users...")
        User.query.delete()
        
        # Commit all deletions
        db.session.commit()
        print("✅ All data cleared successfully!")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error clearing data: {e}")
        return False
    
    return True

def recreate_admin_user():
    """Create a fresh admin user"""
    print("👤 Creating admin user...")
    
    try:
        admin = User(
            username='admin',
            email='admin@smartshoe.com',
            role='admin'
        )
        admin.set_password('admin123')
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Admin user created:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   Role: admin")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating admin user: {e}")
        return False
    
    return True

def add_basic_categories():
    """Add some basic categories to get started"""
    print("📂 Adding basic categories...")
    
    categories = [
        {'name': 'Sneakers', 'description': 'Sports and casual sneakers'},
        {'name': 'Formal', 'description': 'Office and formal shoes'},
        {'name': 'Casual', 'description': 'Everyday casual shoes'},
        {'name': 'Running', 'description': 'Running and athletic shoes'},
        {'name': 'Sandals', 'description': 'Open-toe sandals and flip-flops'},
    ]
    
    try:
        for cat_data in categories:
            category = Category(**cat_data)
            db.session.add(category)
        
        db.session.commit()
        print(f"✅ Added {len(categories)} categories")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding categories: {e}")
        return False
    
    return True

def add_basic_brands():
    """Add some basic brands to get started"""
    print("🏷️  Adding basic brands...")
    
    brands = [
        {'name': 'Nike', 'country': 'USA'},
        {'name': 'Adidas', 'country': 'Germany'},
        {'name': 'Puma', 'country': 'Germany'},
        {'name': 'Converse', 'country': 'USA'},
        {'name': 'Vans', 'country': 'USA'},
        {'name': 'New Balance', 'country': 'USA'},
        {'name': 'Reebok', 'country': 'UK'},
        {'name': 'Bata', 'country': 'Kenya'},
    ]
    
    try:
        for brand_data in brands:
            brand = Brand(**brand_data)
            db.session.add(brand)
        
        db.session.commit()
        print(f"✅ Added {len(brands)} brands")
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error adding brands: {e}")
        return False
    
    return True

def main():
    """Main function to reset the database"""
    print("=" * 60)
    print("🏪 SMARTSHOE DATABASE RESET TOOL")
    print("=" * 60)
    print()
    print("⚠️  WARNING: This will DELETE ALL DATA in your database!")
    print("   - All products will be removed")
    print("   - All sales history will be lost")
    print("   - All inventory records will be deleted")
    print("   - All users will be removed")
    print()
    
    # Ask for confirmation
    response = input("Are you SURE you want to continue? Type 'YES' to proceed: ")
    
    if response != 'YES':
        print("❌ Operation cancelled. No data was deleted.")
        sys.exit(0)
    
    print()
    print("🚀 Starting database reset...")
    print()
    
    # Create app context
    app = create_app('development')
    
    with app.app_context():
        # Step 1: Clear all data
        if not clear_all_data():
            print("❌ Failed to clear data. Exiting.")
            sys.exit(1)
        
        print()
        
        # Step 2: Recreate admin user
        if not recreate_admin_user():
            print("❌ Failed to create admin user. Exiting.")
            sys.exit(1)
        
        print()
        
        # Step 3: Add basic categories
        if not add_basic_categories():
            print("❌ Failed to add categories. Exiting.")
            sys.exit(1)
        
        print()
        
        # Step 4: Add basic brands
        if not add_basic_brands():
            print("❌ Failed to add brands. Exiting.")
            sys.exit(1)
        
        print()
        print("=" * 60)
        print("🎉 DATABASE RESET COMPLETE!")
        print("=" * 60)
        print()
        print("✅ Your SmartShoe system is now empty and ready for fresh data!")
        print()
        print("🔑 Login credentials:")
        print("   Frontend: http://localhost:5173")
        print("   Username: admin")
        print("   Password: admin123")
        print()
        print("📝 Next steps:")
        print("   1. Login to your system")
        print("   2. Add your products")
        print("   3. Add stock for each product")
        print("   4. Start making sales!")
        print()

if __name__ == '__main__':
    main()