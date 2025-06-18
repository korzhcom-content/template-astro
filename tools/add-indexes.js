import fs, { readFileSync } from 'fs'
import path from 'path';
// import { Screen, Progress } from '@olton/terminal'
import matter from 'gray-matter';

if (process.argv.length < 3) {
    console.error("Usage: node create-indexes.js <folder path>");
    process.exit(1);
}

const rootFolder = process.argv[2];
const dirs = [];
const root_docs = ['src', 'content', 'docs'].join(path.sep) + path.sep

const getSlug = (fullPath, root, sep) => {
    return `${fullPath.replace(root, '').replace(/\\/g, '/')}`
        .split(sep)
        .join(sep)
}

const isEmpty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

const getSectionSubsections = (folderPath) => {
    const subsections = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => [entry.name, entry.parentPath]);

    if (subsections.length === 0) {
        return '';
    }

    let content = '## Subsections:\n';

    for (const [subsection_name, subsection_path] of subsections ) {
        let fileContent = readFileSync(path.resolve(subsection_path, subsection_name, "index.md"), 'utf-8').trim()
        let { data: frontmatter } = matter(fileContent)
        content += `- [${frontmatter.title}](${getSlug(subsection_path+path.sep+subsection_name, root_docs, "/")})\n`;
    }

    content += `---\n`;

    return content;
}

const getSectionArticles = (folderPath) => {
    const articles = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(entry => entry.isFile() && entry.name !== "index.md" && entry.name !== "__section.md" && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')))
        .map(entry => [entry.name, entry.parentPath]).sort((a, b) => {
            let fileContentA = readFileSync(path.resolve(a[1], a[0]), 'utf-8').trim()
            let { data: frontmatterA } = matter(fileContentA)

            let fileContentB = readFileSync(path.resolve(b[1], b[0]), 'utf-8').trim()
            let { data: frontmatterB } = matter(fileContentB)

            return (frontmatterA.sidebar?.order || 0) - (frontmatterB.sidebar?.order || 0)
        })

    let content = '';

    if (articles.length > 0) {
        content = '\n---\n## In this section:\n';

        for (const [article_name, article_path] of articles ) {
            let fileContent = fs.readFileSync(path.resolve(article_path, article_name), 'utf-8').trim()
            let { data: frontmatter } = matter(fileContent)
            const frontMatterPresent = isEmpty(frontmatter) === false

            if (frontMatterPresent) {
                const { title, slug = '' } = frontmatter;
                content += `- [${title}](${slug})\n`;
            }
        }

        content += `---\n`;
    }

    content += getSectionSubsections(folderPath);

    return content;
}

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

function processFolder(folderPath) {
    console.log(`Processing folder: ${folderPath}`);

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

        const frontMatter = `---\ntitle: "${caption}"\n---\n\n`;
        content = frontMatter + lines.join('\n');

        content += getSectionArticles(folderPath);

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
