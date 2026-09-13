import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('10.0.0.111', username='root', password=r'Saloh@5659', timeout=10)

sftp = ssh.open_sftp()
with sftp.open('/tmp/check_fe.py', 'w') as f:
    f.write('''import sys
sys.path.append('/app')
from deployment_orchestrator import run_sqlite_query
_, o, _ = run_sqlite_query('10.0.0.241', "SELECT Type, Raw FROM settings WHERE Type = 'FatalErrors';")
print(repr(o))
''')
sftp.close()

stdin, stdout, _ = ssh.exec_command('docker exec -i guestscreen_central_server python3 < /tmp/check_fe.py')
print('SQLITE FATAL_ERRORS:', stdout.read().decode('utf-8'))
ssh.close()
