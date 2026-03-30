<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Webhook Idempotency - ContentFlow</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <div class="container mx-auto px-4 py-8" x-data="idempotencyTest()">
        <div class="max-w-6xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">🧪 Webhook Idempotency Tester</h1>
            
            <!-- Test Form -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-xl font-semibold mb-4">Run Idempotency Test</h2>
                
                <form @submit.prevent="runTest()" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Gateway</label>
                            <select x-model="form.gateway" class="w-full border border-gray-300 rounded-md px-3 py-2">
                                <option value="stripe">Stripe</option>
                                <option value="wompi">Wompi</option>
                                <option value="payu">PayU</option>
                                <option value="mercadopago">MercadoPago</option>
                                <option value="epayco">ePayco</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Workspace</label>
                            <select x-model="form.workspace_id" class="w-full border border-gray-300 rounded-md px-3 py-2">
                                @foreach($workspaces as $workspace)
                                    <option value="{{ $workspace->id }}">
                                        {{ $workspace->name }} (ID: {{ $workspace->id }})
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Times to Send</label>
                            <input type="number" x-model="form.times" min="2" max="10" 
                                   class="w-full border border-gray-300 rounded-md px-3 py-2">
                        </div>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button type="submit" :disabled="loading" 
                                class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">
                            <span x-show="!loading">🚀 Run Test</span>
                            <span x-show="loading">⏳ Testing...</span>
                        </button>
                        
                        <button type="button" @click="clearTestData()" :disabled="loading"
                                class="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50">
                            🗑️ Clear Test Data
                        </button>
                    </div>
                </form>
            </div>

            <!-- Test Results -->
            <div x-show="results" class="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 class="text-xl font-semibold mb-4">📊 Test Results</h2>
                
                <div x-show="results" class="space-y-4">
                    <!-- Summary -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-sm text-gray-600">Gateway</div>
                            <div class="text-lg font-semibold" x-text="results?.gateway"></div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-sm text-gray-600">Attempts</div>
                            <div class="text-lg font-semibold" x-text="results?.attempts"></div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-sm text-gray-600">Addons Created</div>
                            <div class="text-lg font-semibold" x-text="results?.addons_created"></div>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <div class="text-sm text-gray-600">Idempotency</div>
                            <div class="text-lg font-semibold" 
                                 :class="results?.idempotency_working ? 'text-green-600' : 'text-red-600'"
                                 x-text="results?.idempotency_working ? '✅ Working' : '❌ Failed'">
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Results -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">Request Results</h3>
                        <div class="space-y-2">
                            <template x-for="result in results?.results || []" :key="result.attempt">
                                <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div class="font-medium">Attempt <span x-text="result.attempt"></span>:</div>
                                    <div :class="result.success ? 'text-green-600' : 'text-red-600'">
                                        Status: <span x-text="result.status || 'Error'"></span>
                                    </div>
                                    <div class="text-sm text-gray-600" x-text="result.body?.status || result.error || 'Unknown'"></div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <!-- Recent Events -->
                    <div x-show="results?.recent_events?.length">
                        <h3 class="text-lg font-medium mb-2">Recent Webhook Events</h3>
                        <div class="space-y-1">
                            <template x-for="event in results?.recent_events || []" :key="event.id">
                                <div class="text-sm p-2 bg-gray-50 rounded">
                                    <span class="font-medium" x-text="event.gateway"></span>: 
                                    <span x-text="event.event_id"></span> 
                                    (<span x-text="event.event_type"></span>) - 
                                    <span x-text="event.created_at"></span>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Current Data -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Recent Webhook Events -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold mb-4">🗃️ Recent Webhook Events</h2>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        @forelse($recentEvents as $event)
                            <div class="text-sm p-2 bg-gray-50 rounded">
                                <strong>{{ $event->gateway }}</strong>: {{ $event->event_id }} 
                                ({{ $event->event_type }}) - {{ $event->created_at->format('M j, H:i:s') }}
                            </div>
                        @empty
                            <div class="text-gray-500 text-sm">No webhook events yet</div>
                        @endforelse
                    </div>
                </div>

                <!-- Recent Addons -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold mb-4">📦 Recent Addon Purchases</h2>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        @forelse($recentAddons as $addon)
                            <div class="text-sm p-2 bg-gray-50 rounded">
                                <strong>{{ $addon->addon_sku }}</strong> - {{ $addon->workspace->name ?? 'Unknown' }}
                                <br>
                                <span class="text-gray-600">
                                    Payment: {{ $addon->stripe_payment_intent_id }} - 
                                    {{ $addon->created_at->format('M j, H:i:s') }}
                                </span>
                            </div>
                        @empty
                            <div class="text-gray-500 text-sm">No addon purchases yet</div>
                        @endforelse
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function idempotencyTest() {
            return {
                loading: false,
                results: null,
                form: {
                    gateway: 'stripe',
                    workspace_id: '{{ $workspaces->first()?->id ?? 1 }}',
                    times: 3
                },

                async runTest() {
                    this.loading = true;
                    this.results = null;

                    try {
                        const response = await fetch('/test-idempotency/run', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify(this.form)
                        });

                        this.results = await response.json();
                    } catch (error) {
                        alert('Error running test: ' + error.message);
                    } finally {
                        this.loading = false;
                    }
                },

                async clearTestData() {
                    if (!confirm('Are you sure you want to clear all test data?')) {
                        return;
                    }

                    this.loading = true;

                    try {
                        const response = await fetch('/test-idempotency/clear', {
                            method: 'POST',
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            }
                        });

                        const result = await response.json();
                        if (result.success) {
                            alert('Test data cleared successfully');
                            location.reload();
                        }
                    } catch (error) {
                        alert('Error clearing data: ' + error.message);
                    } finally {
                        this.loading = false;
                    }
                }
            }
        }
    </script>
</body>
</html>