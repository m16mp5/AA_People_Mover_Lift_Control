from django.http import HttpResponse

import socket
import sys
import time
import binascii

def readLiftStatus(request):

    host = '192.168.0.101'
    port = 50000
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    readStatus = binascii.unhexlify("CCDDC00100000DCE9C")
    
    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(readStatus)
        time.sleep(0.3)
        data = s.recv(1024)
        data = binascii.hexlify(data)
        data = data[-10:-8]
        print(type(data))

        if data == b'10':
            print("Lift in 6/F")
        elif data == b'01':
            print("Lift in 7/F")
        else:
            print("Unknown")
    
    except socket.error:
        print('send fail')
        sys.exit()

    return HttpResponse(data)

def press6(request):

    host = '192.168.0.101'
    port = 50000
    seconds = 0.3
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl6 = binascii.unhexlify("CCDDA10100200020E2C4")      # Close relay 6
    op6 = binascii.unhexlify("CCDDA10100000020C284")      # Open relay 6

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(cl6)
        time.sleep(seconds)
        s.send(op6)

    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")

def press7(request):

    host = '192.168.0.101'
    port = 50000
    seconds = 0.3
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl7 = binascii.unhexlify("CCDDA101004000402244")      # Close relay 7
    op7 = binascii.unhexlify("CCDDA10100000040E2C4")      # Open relay 7

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(cl7)
        time.sleep(seconds)
        s.send(op7)

    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")

def pressDoorClose(request):
        
    host = '192.168.0.101'
    port = 50000
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl2 = binascii.unhexlify("CCDDA10100020002A64C")      # Close relay 2

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(cl2)

    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")

def releaseDoorClose(request):
        
    host = '192.168.0.101'
    port = 50000
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    op2 = binascii.unhexlify("CCDDA10100000002A448")      # Open relay 2

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(op2)

    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")

def pressDoorOpen(request):
        
    host = '192.168.0.101'
    port = 50000
    seconds = 0.1
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl3 = binascii.unhexlify("CCDDA10100040004AA54")      # Close relay 3

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(cl3)


    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")

def releaseDoorOpen(request):
        
    host = '192.168.0.101'
    port = 50000
    seconds = 0.1
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    op3 = binascii.unhexlify("CCDDA10100000004A64C")      # Open relay 3

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))
    
    try:
        s.send(op3)

    except socket.error:
        print('send fail')
        sys.exit()
    
    return HttpResponse("OK!")


