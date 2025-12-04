# Backend access to user info and tracking

This module is the one in charge of tracking the user data, from tracking new habits, to registering daily completion of habits. All through an API REST to transfer data between the frontend and database.

It's made with the **FastAPI**, which is made to easly handle RESTful responses. It also uses **SQLAlchemy** to power it's connection with the database

## Database access

To create the connection to the database the backend will look for a `.env` file. This file must define the variables:
* DB_USER
* DB_PASSWORD
* DB_HOST
* DB_NAME
- DB_EXTRAS (optional)

## How to use

From Habitus folder, execute the command:

```bash
uvicorn backend_python.main:app
```

The parameter `--reload` may be used for automatic reload of the backend, on changes to files pretainig to the API. Very useful to check changes manualy while prototyping. 

# Testing

Made using the **Pytest** package, it integrates easly with **FastAPI**.

It automaticaly runs tests defined on python files starting with test_ or ending in _test.

To run the test suite simply use the command:

```bash
pytest
```