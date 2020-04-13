# tsougkrizo
Greek Easter egg dame


# Install

## Pre-requisites

* Python 3.8.2

When you have this Python version, follow the steps below to run the application. In the steps below, replace `python` with the executable that runs Python 3.8 if needed.

## Install/Run application

```
# create virtual environment - needed only the first time
> python -m venv venv

# enable virtual environment - needed when not enabled
> source venv/bin/activate

# install requirements - needed when new dependencies are in requirements.txt
> pip install -r requirements.txt

# run application
> uvicorn main:app --reload
```

Browse application in: `http://127.0.0.1:8000`

## HTML templates

* Html templates should be added in `/templates` directory.
* Filename should be `html.jinja2`
* Documentation https://jinja.palletsprojects.com/en/2.11.x/

## Static files

* In `static` directory
* Example usage in the template:
```
{{ url_for('static', path='/red-egg-sample-static.jpg') }}
```
