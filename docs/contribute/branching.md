We will have two major branches: **master** and **develop** ; and one or more future release branches.

Let's assume our project is currently on version 1.0 and we are working diligently on a 1.1 release due out sometime next week. We may therefore have the following branches:

- Master
- Develop
- 1.2

Let's break down what these branches mean.

### The Master Branch

This reflects a production release. This branch is version 1.0. 

**No work should be done directly on the this branch.**

### Develop Branch

Serves as an integration branch for the upcoming release. This branch is version 1.1. 

> fork from: **master**

> merge into: **master**

### Branch 1.2

This branch is for features to be released after 1.1. 

> fork from: **develop**

> merge into: **develop**
