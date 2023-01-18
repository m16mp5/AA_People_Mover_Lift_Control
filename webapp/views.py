from django.http import HttpResponse

import socket
import sys
import time
import binascii

def liftStatus(request):

    host = '192.168.0.101'
    port = 50000
    seconds = 0.1
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl6 = binascii.unhexlify("CCDDA10100200020E2C4")      # Close relay 6
    op6 = binascii.unhexlify("CCDDA10100000020C284")      # Open relay 6

    cl7 = binascii.unhexlify("CCDDA101004000402244")      # Close relay 7
    op7 = binascii.unhexlify("CCDDA10100000040E2C4")      # Open relay 7

    cl2 = binascii.unhexlify("CCDDA10100000002A448")      # Close relay 2
    op2 = binascii.unhexlify("CCDDA10100020002A64C")      # Open relay 2

    cl3 = binascii.unhexlify("CCDDA10100000004A64C")      # Close relay 3
    op3 = binascii.unhexlify("CCDDA10100040004AA54")      # Open relay 3
    
    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        for x in range(5):
            s.send(cl7)
            time.sleep(seconds)
            s.send(cl6)
            time.sleep(seconds)
            s.send(cl3)
            time.sleep(seconds)
            s.send(cl2)
            time.sleep(seconds)
            s.send(op7)
            time.sleep(seconds)
            s.send(op6)
            time.sleep(seconds)
            s.send(op3)
            time.sleep(seconds)
            s.send(op2)
            time.sleep(seconds)

    except socket.error:
        print('send fail')
        sys.exit()

    return HttpResponse("OK!")





