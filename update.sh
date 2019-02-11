#!/bin/bash
git pull origin master
yarn
npx gulp build
pm2 reload all --trace
