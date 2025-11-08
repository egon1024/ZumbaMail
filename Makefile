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

# Testing targets
test-backend-syntax:
	@echo "Checking Python syntax..."
	$(PYTHON) -m py_compile activity/**/*.py *.py

test-frontend-syntax:
	@echo "Checking JavaScript/React syntax..."
	cd frontend && $(NPM) run lint

test-syntax: test-backend-syntax test-frontend-syntax
	@echo "All syntax checks passed!"

.PHONY: all npm-install python-install migrate build-react collectstatic deploy test-backend-syntax test-frontend-syntax test-syntax
