#!/bin/bash
(cd ./frontend && pnpm run dev) &
(cd ./backend && pnpm run server) &
wait