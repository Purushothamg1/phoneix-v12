#!/bin/bash
# Start backend in background
cd /home/runner/workspace/backend && node dist/server.js &
BACKEND_PID=$!

# Start frontend (blocks, serves on port 5000)
cd /home/runner/workspace/frontend && npm run start

# If frontend exits, kill backend too
kill $BACKEND_PID 2>/dev/null
