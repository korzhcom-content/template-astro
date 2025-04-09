import fs from 'fs';
import path from 'path';
import { Progress } from '@olton/progress'
import { Screen } from '@olton/terminal'

if (process.argv.length < 3) {
    console.error("Usage: node create-indexes.js <folder path>");
    process.exit(1);
}

Screen.clear()

const rootFolder = process.argv[2];
const dirs = [];

const getDirectories = source => {
    fs.readdirSync(source, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(source, entry.name);
        if (entry.isDirectory()) {
            dirs.push(fullPath);
            getDirectories(fullPath);
        }
    });
}

getDirectories(rootFolder)

console.log(`\nAdding indexes...\n`)

const progressBar = new Progress({
    total: dirs.length,
})

function processFolder(folderPath) {
    progressBar.process()
    
    const sectionFile = path.join(folderPath, '__section.md');
    const indexFile = path.join(folderPath, 'index.md');

    if (fs.existsSync(sectionFile) === false) {
        // console.warn(`No __section.md found in ${folderPath}, skipping.`);
        return;
    }
    
    let content = fs.readFileSync(sectionFile, 'utf8');
    let lines = content.split('\n');

    let captionIndex = lines.findIndex(line => line.startsWith('# '));
    if (captionIndex !== -1) {
        let caption = lines[captionIndex].replace(/^#+\s*/, ''); // Remove '#' and spaces
        lines.splice(captionIndex, 1); // Remove the heading from content

        const frontMatter = `---\ntitle: ${caption}\n---\n\n`;
        content = frontMatter + lines.join('\n');

        fs.writeFileSync(indexFile, content, 'utf8');
    }
}

function walkDirectory(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDirectory(fullPath);
            processFolder(fullPath);
        }
    });
}

walkDirectory(rootFolder);
console.log(`\n\nDone! ${dirs.length} dirs processed.\n`)
