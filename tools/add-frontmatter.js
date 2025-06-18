/*
* Add frontmatter to all Markdown files in the folder
* */
import { globSync } from 'glob';
import { readFileSync, writeFileSync, renameSync } from 'fs';
import { basename, dirname, sep } from 'path';
import matter from 'gray-matter';
import { Screen, Progress } from "@olton/terminal"

if (process.argv.length < 3) {
    console.error("Usage: node add-frontmatter.js <folder path>");
    process.exit(1);
}

const args = process.argv.slice(2);
const root = args[0];

const isEmpty = (obj) => {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function frontmatter(path, options = {}) {
    const { skip = [], skipUnderLineFiles = true, pattern } = options
    const files = globSync(`${path}${pattern}`, { stat: true })

    console.log(`\nAdding frontmatter...\n`)
    const progressBar = new Progress({
        total: files.length,
    })
    
    let index = 1
    let currDir = ''
    
    for (const file of files) {
        progressBar.process()

        let fileContent = readFileSync(file, 'utf-8').trim()
        let { data: frontmatter, content } = matter(fileContent)
        const frontMatterPresent = isEmpty(frontmatter) === false

        const name = basename(file)
        const dir = dirname(file)
    
        if (currDir !== dir) {
            currDir = dir
            index = 1
        } 
        
        let slug = '' 
        let title = !frontMatterPresent ? name.replace('.md', '').replace('.mdx', '') : frontmatter.title

        if (skipUnderLineFiles && name.startsWith('_') || skip.includes(name)) {
            // skip a file
            continue
        }

        const lines = content.trim().split('\n')
        
        if (!frontMatterPresent && lines[0].startsWith('# ')) {
            title = lines[0]
              .replace('# ', '')
              .replace(":", '')
            lines.shift()
            content = lines.join('\n')
        }
        slug = file
            .replace('src\\content\\docs\\', '')
            .replace('src/content/docs/', '')
            .replace('.md', '')
            .replaceAll('\\', '/')

        frontmatter.title = title
        frontmatter.slug = slug        
        
        if (!frontmatter.sidebar) {
            frontmatter.sidebar = {
                order: 100,
            }
        }

        const newContent = content
            .replaceAll('](', '](/')
            .replaceAll('/http', 'http')
            .replaceAll('https://korzh.com/easyquery/docs', '')
            .replaceAll('https://files.aistant.com/korzh/easyquery-dotnet/images/', '/easyquery/docs/images/')
        
        writeFileSync(file, matter.stringify(newContent, frontmatter), 'utf-8')
        
        index++
    }

    console.log(`\n\nDone! ${files.length} files processed.\n`)
}

Screen.clear()

frontmatter(root, {
    skip: ['index.md', 'index.mdx'],
    pattern: `/**/*.{md,mdx}`,
})
