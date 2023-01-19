from django.http import HttpResponse

import socket
import sys
import time
import binascii

def action(request):

    host = '192.168.0.101'
    port = 50000
    interval = 0.3
    
    s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

    cl6 = binascii.unhexlify("CCDDA10100200020E2C4")      # Close relay 6
    op6 = binascii.unhexlify("CCDDA10100000020C284")      # Open relay 6
    cl7 = binascii.unhexlify("CCDDA101004000402244")      # Close relay 7
    op7 = binascii.unhexlify("CCDDA10100000040E2C4")      # Open relay 7
    cl2 = binascii.unhexlify("CCDDA10100020002A64C")      # Close relay 2, Press Door Close
    op2 = binascii.unhexlify("CCDDA10100000002A448")      # Open relay 2, Release Door Close
    cl3 = binascii.unhexlify("CCDDA10100040004AA54")      # Close relay 3, Press Door Open
    op3 = binascii.unhexlify("CCDDA10100000004A64C")      # Open relay 3, Releas Door Open

    try:
        s.connect((host, port))

    except socket.gaierror:
        print('Hostname could not be resolved Exiting')
        sys.exit()
        
    print('Socket connected to ' + host + ' on port ' + str(port))

    if request.method == 'GET':
        action = request.GET.get('action', )
        if action == "press6":
            try:
                s.send(cl6)
                time.sleep(interval)
                s.send(op6)
                res = "Pressed 6/F"
            except socket.error:
                print('send fail')
                sys.exit()
        elif action == "press7":
            try:
                s.send(cl7)
                time.sleep(interval)
                s.send(op7)
                res = "Pressed 7/F"
            except socket.error:
                print('send fail')
                sys.exit()
        elif action == "pressDoorClose":
            try:
                s.send(cl2)
                res = "Pressed Door Close"
            except socket.error:
                print('send fail')
                sys.exit()
        elif action == "releaseDoorClose":
            try:
                s.send(op2)
                res = "Released Door Close"
            except socket.error:
                print('send fail')
                sys.exit()
        elif action == "pressDoorOpen":
            try:
                s.send(cl3)
                res = "Pressed Door Open"
            except socket.error:
                print('send fail')
                sys.exit()
        elif action == "releaseDoorOpen":
            try:
                s.send(op3)
                res = "Released Door Open"
            except socket.error:
                print('send fail')
                sys.exit()
        else:
            res = "Invalid action!"
            
    return HttpResponse(res)

def readLiftStatus(request):

    host = '192.168.0.101'
    port = 50000
    interval = 0.3
    
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
        time.sleep(interval)        # time for receive complete return message
        data = s.recv(1024)
        data = binascii.hexlify(data)
        data = data[-10:-8]

        if data == b'10':
            res = "Lift in 6/F"
        elif data == b'01':
            res = "Lift in 7/F"
        else:
            res = "Unknown Floor"
    
    except socket.error:
        print('send fail')
        sys.exit()

    return HttpResponse(res)
