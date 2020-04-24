# tsougkrizo
Greek Easter egg dame


# Install

## Pre-requisites

* Python >= 3.6, ideally 3.8.2 
* git
* Visual studio code (any IDE would work, but this would be easier to collaborate)

Below there are details on how to setup for a windows environment:

### Install Python (windows)
https://www.python.org/downloads/windows/

### Install git (not the same as github)
https://tutorial.djangogirls.org/en/installation/#installing-git

### Visual studio code
https://code.visualstudio.com

## Clone the application
That step bring the application code locally. Git needs to be installed. Follow the steps below in the command line (it is possible to use the console inside visual studio code)

https://help.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository#cloning-a-repository-using-the-command-line

## Install/Run application

When you have this Python version, follow the steps below to run the application. In the steps below, replace `python` with the executable that runs Python 3.8 if needed. Run this in the command line (it is possible to use the console inside visual studio code)


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
