import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/campaign/approve-gate-1',
    data=b'{"db_id":"test"}',
    headers={'Content-Type': 'application/json'}
)
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"OTHER ERROR: {e}")
