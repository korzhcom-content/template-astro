import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const sidebar = []
const root_docs = ["src", "content", "docs"].join(path.sep) + path.sep;

const getSlug = (fullPath, root, sep) => {
    return `${fullPath.replace(root, '').replace(/\\/g, '/')}`.split(sep).slice(0, -1).join(sep)
}

function traverseDirectory(dir, parent) {
    try {
        parent.label = fs.existsSync(dir + path.sep + "__section.md")
            ? fs.readFileSync(dir + path.sep + "__section.md", 'utf8').split("\n")[0].replace('#', '').trim() :
            dir.replace(root_docs, '');

        const entries = fs.readdirSync(dir, { withFileTypes: true })
          .filter(entry => {
            return !entry.name.startsWith('_');
          })
          .sort((a, b) => {
            if (a.isDirectory() && b.isDirectory()) {
                return a.name.localeCompare(b.name);
            } else if (a.isDirectory()) {
                return -1;
            } else if (b.isDirectory()) {
                return 1;
            } else {
                const _a = matter(fs.readFileSync(path.join(a.parentPath, a.name), 'utf8'));
                const _b = matter(fs.readFileSync(path.join(b.parentPath, b.name), 'utf8'));
                
                if (_a.data.sidebar && _b.data.sidebar) {
                    if (_a.data.sidebar.order === _b.data.sidebar.order) {
                        return _a.data.title.localeCompare(_b.data.title);
                    } else {
                        return _a.data.sidebar.order - _b.data.sidebar.order;
                    }                    
                }
                
                return _a.data.title.localeCompare(_b.data.title);
            }
        });

        entries.forEach(entry => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const new_section = {
                    label: entry.name,
                    collapsed: true,
                    items: []
                }
                parent.items.push(new_section)
                traverseDirectory(fullPath, new_section); // Рекурсивно обходимо підкаталог
            } else {
                if (entry.name.includes("__section")) {   
                    return
                }
                if (entry.name.includes("index")) {
                    parent.items.unshift(getSlug(fullPath, root_docs, '/'))
                }
                else {
                    parent.items.push(getSlug(fullPath, root_docs, '.'))
                }
            }
        });
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }
}

export default function (root, collapsed = true) {
    sidebar.length = 0;
    const _parent = {
        label: root,
        collapsed,
        items: []
    }
    sidebar.push(_parent)
    traverseDirectory(root, _parent);
    return sidebar;
}