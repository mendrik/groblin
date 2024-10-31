-- Create table for nodes
CREATE TABLE node (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    parent_id INTEGER REFERENCES node ON DELETE CASCADE
);

-- Create index on node id
CREATE INDEX node_id ON node (id);

-- Create table for projects
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

-- Create index on project id
CREATE INDEX project_id ON project (id);

-- Create table for project-node relationships
CREATE TABLE project_node (
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    node_id INTEGER NOT NULL REFERENCES node(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, node_id)
);

-- Create index on project_node node_id
CREATE INDEX project_node_node_id ON project_node (node_id);

-- Create index on project_node project_id
CREATE INDEX project_node_project_id ON project_node (project_id);

-- Create unique index for project_node project_id
CREATE UNIQUE INDEX sqlite_autoindex_project_node_1 ON project_node (project_id);

-- Create table for tags
CREATE TABLE tag (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES tag ON DELETE SET NULL
);

-- Create index on tag id
CREATE INDEX tag_id ON tag (id);

-- Create table for users
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create table for project-user relationships
CREATE TABLE project_user (
    project_id INTEGER NOT NULL REFERENCES project ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user" ON DELETE CASCADE,
    role TEXT NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- Create index on project_user project_id
CREATE INDEX project_user_project_id ON project_user (project_id);

-- Create index on project_user user_id
CREATE INDEX project_user_user_id ON project_user (user_id);

-- Create unique index for project_user project_id
CREATE UNIQUE INDEX sqlite_autoindex_project_user_1 ON project_user (project_id);

-- Create index on user id
CREATE INDEX user_id ON "user" (id);
