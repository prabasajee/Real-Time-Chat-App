#!/bin/bash

# Secure Setup Script for Voice Chat App
# This script helps you set up the application securely

echo "🔥 Voice Chat App - Secure Setup"
echo "================================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Copy environment template
if [ -f ".env.template" ]; then
    cp .env.template .env
    echo "✅ Created .env file from template"
else
    echo "❌ .env.template not found!"
    exit 1
fi

# Instructions
echo ""
echo "📝 Next Steps:"
echo "1. Edit the .env file with your Firebase credentials"
echo "2. Get your Firebase config from: https://console.firebase.google.com"
echo "3. Never commit the .env file to version control"
echo ""
echo "🔧 To edit your configuration:"
echo "   nano .env    (or use your preferred editor)"
echo ""
echo "🚀 To start the application:"
echo "   Open index.html in your browser"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
echo "🔒 Security reminder: Your .env file is already in .gitignore"
