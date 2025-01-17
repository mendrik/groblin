#!/bin/bash
killport 5173
killport 6173
(cd ./frontend && pnpm run dev) &
(cd ./backend && pnpm run server) &
(cd ./backend && pnpm run server:public) &
wait
