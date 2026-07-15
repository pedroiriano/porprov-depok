#!/bin/bash
export PATH=$PATH:/opt/keycloak/bin
kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin_secret

# Create roles (ignore errors if they already exist)
kcadm.sh create roles -r porprov -s name=super_admin || true
kcadm.sh create roles -r porprov -s name=admin_venue || true
kcadm.sh create roles -r porprov -s name=koresponden || true
kcadm.sh create roles -r porprov -s name=verifikator || true
kcadm.sh create roles -r porprov -s name=auditor || true

# Create super admin user
kcadm.sh create users -r porprov -s username=admin_depok -s enabled=true -s email=admin@porprov.depok.go.id -s firstName=Admin -s lastName=Depok || true
kcadm.sh set-password -r porprov --username admin_depok --new-password password || true
kcadm.sh add-roles -r porprov --uusername admin_depok --rolename super_admin || true

# Create koresponden user
kcadm.sh create users -r porprov -s username=koresponden_1 -s enabled=true -s email=koresponden1@porprov.depok.go.id -s firstName=Budi -s lastName=Pramono || true
kcadm.sh set-password -r porprov --username koresponden_1 --new-password password || true
kcadm.sh add-roles -r porprov --uusername koresponden_1 --rolename koresponden || true
