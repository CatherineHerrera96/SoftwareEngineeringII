# Database related files
This folder is meant for `.sql` files to be used with the database.

## Database initialization
All `.sql` files under the folder `/db/` will be executed when initializing the database.

They get executed in the order given by their names, so it's standart to start file names with numbers to control their execution order.

# Queries
Files under the `/db/queries/` are meant as guidelines for queries used by the backend to access data. This allows for queries to be tested with an external service (like `pgadmin`), before they are used in production.

# Migrations
Under `/db/migrations/` there are files specifying changes done to the database, these changes aren't well documented as of now.