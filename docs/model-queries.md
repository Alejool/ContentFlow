# Laravel Model Query Operations Guide

## Basic Retrieval Methods
```php
// Get all records
Model::all();

// Get with pagination
Model::paginate(10);
Model::simplePaginate(10);

// Get specific columns
Model::select('name', 'email')->get();

// Find by ID
Model::find(1);
Model::findOrFail(1);