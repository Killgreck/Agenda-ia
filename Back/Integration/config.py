import os
from dotenv import load_dotenv

load_dotenv()

ABACUS_AGENT_ID = os.getenv('ABACUS_AGENT_ID', '8e5a8113a')
ABACUS_API_KEY = os.getenv('ABACUS_API_KEY', 's2_a263102b8809400498c3d47dea3689fd')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
