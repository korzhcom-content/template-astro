import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const sidebar = []
const root_docs = ['src', 'content', 'docs'].join(path.sep) + path.sep

const getSlug = (fullPath, root, sep) => {
    return `${fullPath.replace(root, '').replace(/\\/g, '/')}`.split(sep).slice(0, -1).join(sep)
}

const getEntryPointData = entry => {
    let name = entry.name, order = -1

    if (entry.isDirectory()) {
        const dirPath = path.join(entry.parentPath, entry.name)
        if (fs.existsSync(path.join(dirPath, 'frontmatter.json'))) {
            const fm = JSON.parse(fs.readFileSync(path.join(dirPath, 'frontmatter.json'), 'utf8'))
            if (fm.title) { name = fm.title }
            if (fm.sidebar && fm.sidebar.order) { order = fm.sidebar.order }
        }
        if (fs.existsSync(path.join(dirPath, '__section.md'))) {
            name = fs.readFileSync(path.join(dirPath, '__section.md'), 'utf8').split('\n')[0]?.replace('#', '')?.trim()
        }
    } else {
        const fm = matter(fs.readFileSync(path.join(entry.parentPath, entry.name), 'utf8'))
        if (fm.data.title) { name = fm.data.title }
        if (entry.name === 'index.md') {
            order = 0
        } else if (fm.data.sidebar && fm.data.sidebar.order) {
            order = fm.data.sidebar.order
        }
    }

    return [order,  name]
}

const sortEntries = (a, b) => {
    let [aOrder, aName] = getEntryPointData(a)
    let [bOrder, bName] = getEntryPointData(b)

    if (aOrder < 0 || bOrder < 0) {
        return aName.localeCompare(bName, "en")
    }

    return aOrder - bOrder
}

function traverseDirectory (dir, parent) {
    try {
        parent.label = fs.existsSync(dir + path.sep + '__section.md')
            ? fs.readFileSync(dir + path.sep + '__section.md', 'utf8').split('\n')[0].replace('#', '').trim() :
            dir.replace(root_docs, '')

        const entries = fs.readdirSync(dir, { withFileTypes: true })
            .filter(entry => {
                return !entry.name.startsWith('_') && !entry.name.endsWith('.json')
            })
            .sort(sortEntries)

        // console.log(entries.filter(entry => entry.parentPath.includes('common-sql')))

        entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                const new_section = {
                    label: entry.name,
                    collapsed: true,
                    items: []
                }
                parent.items.push(new_section)
                traverseDirectory(fullPath, new_section) // Рекурсивно обходимо підкаталог
            } else {
                if (entry.name.includes('index')) {
                    parent.items.unshift(getSlug(fullPath, root_docs, '/'))
                } else {
                    parent.items.push(getSlug(fullPath, root_docs, '.'))
                }
            }
        })
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err)
    }
}

export default function (root, collapsed = true) {
    sidebar.length = 0
    const _parent = {
        label: root,
        collapsed,
        items: []
    }
    sidebar.push(_parent)
    traverseDirectory(root, _parent)
    return sidebar
}