#!/bin/bash

# Script to rename 'attrs' to 'attributes' across the codebase
# Run this from the project root directory

# Save current git branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Create a new branch if not already on it
if [ "$CURRENT_BRANCH" != "chore-attributes" ]; then
  echo "Creating and switching to chore-attributes branch..."
  git checkout -b chore-attributes
fi

# Files to process - only components directory
FILES=$(find src/components -type f -name "*.ts" | grep -v ".d.ts" | grep -v "test.ts")

# Counter for files modified
MODIFIED_COUNT=0

for file in $FILES; do
  # Check if file contains 'attrs'
  if grep -q "attrs" "$file"; then
    echo "Processing $file..."
    
    # Replace all variable references while keeping variable names intact
    # First pass to handle most common cases
    sed -i '' 's/attrs:/attributes:/g' "$file"
    sed -i '' 's/const attrs/const attributes/g' "$file"
    sed -i '' 's/\.attrs/\.attributes/g' "$file"
    sed -i '' 's/attrs?/attributes?/g' "$file"
    sed -i '' 's/attrs /attributes /g' "$file"
    sed -i '' 's/attrs,/attributes,/g' "$file"
    sed -i '' 's/attrs)/attributes)/g' "$file"
    sed -i '' 's/attrs=/attributes=/g' "$file"
    sed -i '' 's/attrs\./attributes./g' "$file"
    
    # Fix multi-word variables
    sed -i '' 's/ariaAttrs/ariaAttributes/g' "$file"
    sed -i '' 's/dataAttrs/dataAttributes/g' "$file"
    sed -i '' 's/inputAttrs/inputAttributes/g' "$file"
    
    # Fix bracket notations
    sed -i '' 's/\[["'\'']\?attrs["'\'']\?]/['\''attributes'\'']/g' "$file"
    
    # Using Perl for more complex replacements
    perl -i -pe 's/attrs\[([^\]]+)\]/attributes\[\1\]/g' "$file"
    
    # Count modified files
    MODIFIED_COUNT=$((MODIFIED_COUNT + 1))
  fi
done

echo "Modified $MODIFIED_COUNT files"

# Show status
git status

echo ""
echo "IMPORTANT: Please review the changes before committing!"
echo "To commit run: git add . && git commit -m \"refactor: rename attrs to attributes across components\"" 