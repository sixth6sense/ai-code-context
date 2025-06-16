#!/bin/bash

# AI Code Context Demo Script
# This script demonstrates the basic functionality of ai-code-context

set -e

echo "🤖 AI Code Context Demo"
echo "======================"
echo ""

# Create a temporary demo project
DEMO_DIR="ai-context-demo"
if [ -d "$DEMO_DIR" ]; then
    rm -rf "$DEMO_DIR"
fi

echo "📁 Creating demo project..."
mkdir "$DEMO_DIR"
cd "$DEMO_DIR"

# Initialize git repository
git init
git config user.email "demo@example.com"
git config user.name "Demo User"

# Create some sample files
echo "console.log('Hello World!');" > hello.js

cat > package.json << EOF
{
  "name": "demo-project",
  "version": "1.0.0",
  "description": "A demo React application",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
EOF

cat > README.md << EOF
# Demo Project

This is a sample React application for testing AI Code Context.

## Features

- React components
- Modern JavaScript
- TypeScript support (coming soon)
EOF

# Add and commit initial files
git add .
git commit -m "Initial commit: Add basic project structure"

echo ""
echo "✅ Demo project created!"
echo ""

# Show AI Code Context status
echo "📊 Checking AI Code Context status..."
ai-context status
echo ""

# Create a React component
echo "⚛️ Adding a React component..."
cat > UserProfile.jsx << 'EOF'
import React, { useState } from 'react';

export const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="user-profile-form">
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="user-profile">
      <div className="avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={`${user.name}'s avatar`} />
        ) : (
          <div className="avatar-fallback">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="profile-info">
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <button onClick={() => setIsEditing(true)}>Edit Profile</button>
      </div>
    </div>
  );
};

export default UserProfile;
EOF

# Add and commit the component
git add UserProfile.jsx
git commit -m "feat: Add UserProfile React component with edit functionality"

echo ""
echo "📝 Analyzing the component change..."
echo "Note: This would normally use AI analysis, but requires an API key."
echo "You can set OPENAI_API_KEY or ANTHROPIC_API_KEY to see full analysis."
echo ""

# Show help for analysis command
ai-context analyze --help

echo ""
echo "🎯 Demo Commands to Try:"
echo ""
echo "1. Set up configuration:"
echo "   ai-context init"
echo ""
echo "2. Analyze the last commit:"
echo "   ai-context analyze --commit HEAD~1..HEAD"
echo ""
echo "3. Analyze staged changes:"
echo "   git add <some-file>"
echo "   ai-context analyze --staged"
echo ""
echo "4. Set up auto-analysis:"
echo "   ai-context watch --install-hook"
echo ""
echo "5. Manage configuration:"
echo "   ai-context config --show"
echo "   ai-context config --set aiProvider=anthropic"
echo ""

echo "🚀 Demo complete! Check out the project in: $(pwd)"
echo "📚 Read the full documentation at: https://github.com/mucahitgurbuz/ai-code-context"
