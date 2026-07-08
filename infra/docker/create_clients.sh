#!/bin/bash
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin_secret
/opt/keycloak/bin/kcadm.sh create clients -r porprov -s clientId=porprov-admin-web -s publicClient=true -s 'redirectUris=["http://localhost:5173/*"]' -s 'webOrigins=["+"]'
/opt/keycloak/bin/kcadm.sh create clients -r porprov -s clientId=porprov-mobile-admin -s publicClient=true -s directAccessGrantsEnabled=true -s 'redirectUris=["exp://10.0.2.2:8081", "porprov://*", "http://localhost:8081/*"]' -s 'webOrigins=["+"]'
