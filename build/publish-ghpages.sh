#!/bin/bash
git clone $REPO_URL temp
cd temp
git checkout gh-pages
cd ..
cp -a ./out/. ./temp/
cd temp
git add -A
git config user.name "Travis Build"
git config user.email "oshomburg@gmail.com"
git commit -m "push to github pages (auto)" -m "$TRAVIS_COMMIT_MSG"
git push $REPO_URL gh-pages
