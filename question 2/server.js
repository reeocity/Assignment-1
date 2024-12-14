const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 4000;
const DATA_FILE = path.join(__dirname, 'items.json');


const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Function to get the next sequential ID
const getNextId = (items) => {
    if (items.length === 0) return 1; 
    const maxId = Math.max(...items.map(item => item.id));
    return maxId + 1;
};

// Create HTTP server
const server = http.createServer((req, res) => {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString(); // Convert buffer to string
    });

    req.on('end', () => {
        if (req.url === '/api/items' && req.method === 'GET') {
            // Get all items
            const items = readData();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(items));
        } else if (req.url === '/api/items' && req.method === 'POST') {
            // Create new item with proper ID
            const items = readData();
            const newItem = JSON.parse(body);
            newItem.id = getNextId(items); // Set the next ID
            items.push(newItem);
            writeData(items);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newItem));
        } else if (req.url.match(/\/api\/items\/\d+/) && req.method === 'GET') {
            // Get one item
            const id = parseInt(req.url.split('/')[3]);
            const items = readData();
            const item = items.find((i) => i.id === id);
            if (item) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(item));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Item not found');
            }
        } else if (req.url.match(/\/api\/items\/\d+/) && req.method === 'PUT') {
            // Update an item
            const id = parseInt(req.url.split('/')[3]);
            let items = readData();
            const index = items.findIndex((i) => i.id === id);
            if (index !== -1) {
                const updatedItem = JSON.parse(body);
                updatedItem.id = id; // Keep the same ID
                items[index] = updatedItem;
                writeData(items);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(updatedItem));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Item not found');
            }
        } else if (req.url.match(/\/api\/items\/\d+/) && req.method === 'DELETE') {
            // Delete an item
            const id = parseInt(req.url.split('/')[3]);
            let items = readData();
            const newItems = items.filter((i) => i.id !== id);
            if (items.length !== newItems.length) {
                writeData(newItems);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Item deleted successfully');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Item not found');
            }
        } else {
            // Default route
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - Route Not Found');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
