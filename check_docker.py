import paramiko
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('10.0.0.111', username='root', password='123')
stdin, stdout, stderr = client.exec_command('docker ps')
print(stdout.read().decode('utf-8'))
