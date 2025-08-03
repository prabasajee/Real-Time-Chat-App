const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(userId);
    });


    socket.on('send_message', (data) => {
        // Broadcast to recipient
        io.to(data.to).emit('receive_message', data);
    });

    // File upload via base64 (for small files/images)
    socket.on('send_file', (data) => {
        // data: { from, to, filename, filedata (base64), type }
        io.to(data.to).emit('receive_message', {
            from: data.from,
            to: data.to,
            content: `<a href='${data.filedata}' download='${data.filename}'>📎 ${data.filename}</a>`,
            type: 'file',
            filename: data.filename
        });
    });

    socket.on('typing', (data) => {
        io.to(data.to).emit('typing', data);
    });
});

server.listen(3000, () => {
    console.log('Socket.IO server running on http://localhost:3000');
});