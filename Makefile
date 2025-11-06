# Basic Makefile for production deployment of ZumbaMail
# Usage: make deploy

PYTHON=python3
PIP=pip3
NPM=npm
MANAGE=python manage.py

all: deploy

npm-install:
	cd frontend && $(NPM) install

python-install:
	$(PIP) install -r requirements.txt

migrate:
	$(MANAGE) migrate

build-react:
	cd frontend && $(NPM) run build

collectstatic:
	$(MANAGE) collectstatic --noinput

deploy: npm-install python-install migrate build-react collectstatic
	@echo "Deployment steps complete."

.PHONY: all npm-install python-install migrate build-react collectstatic deploy
