const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') && !fullPath.includes('components/ui/Text.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Check if it imports Text from react-native
            const rnImportRegex = /import\s+{[^}]*?\bText\b[^}]*?}\s+from\s+['"]react-native['"]\s*;/g;
            if (rnImportRegex.test(content)) {
                // First, remove Text from the react-native import
                content = content.replace(/import\s+({[^}]*?})\s+from\s+['"]react-native['"]\s*;/g, (match, p1) => {
                    if (p1.includes('Text')) {
                        // Remove Text whether it's at the start, middle, or end of the destructured list
                        let newImports = p1.replace(/\bText\b\s*,?/, '').replace(/,\s*}/, '}');

                        // If it ends up empty e.g. import { } from 'react-native';
                        if (newImports.trim() === '{}') {
                            return '';
                        }
                        return `import ${newImports} from 'react-native';`;
                    }
                    return match;
                });

                // Then, add our custom import right below the first import statement
                content = content.replace(/^(import.*?;)/m, `$1\nimport { Text } from '@/components/ui/Text';`);

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

// Ensure the custom Text component itself imports properly
processDir(path.join(__dirname, 'app'));
processDir(path.join(__dirname, 'components'));
console.log('Done!');
