import os

permissions_code = """from rest_framework import permissions
from apps.vendors.models import VendorStatus

class IsStaffUser(permissions.BasePermission):
    \"\"\"
    Allows access only to staff/admin users.
    \"\"\"
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsVendorOwner(permissions.BasePermission):
    \"\"\"
    Allows access to vendor owners accessing their own objects.
    Designers can post and manage their wares, profile, and orders immediately.
    \"\"\"
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'vendor_profile')
            and request.user.vendor_profile.status != VendorStatus.SUSPENDED
        )

    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated and hasattr(request.user, 'vendor_profile')):
            return False
        
        vendor_profile = request.user.vendor_profile
        if hasattr(obj, 'vendor'):
            return obj.vendor == vendor_profile
        if hasattr(obj, 'vendor_id'):
            return obj.vendor_id == vendor_profile.id
        return obj == vendor_profile
"""

selectors_code = """from django.shortcuts import get_object_or_404
from .models import VendorProfile, BankAccount, VendorStatus


def get_vendor_by_slug(slug: str) -> VendorProfile:
    \"\"\"
    Public storefront selector returning active/registered vendor profile.
    Only excludes suspended storefronts.
    \"\"\"
    return get_object_or_404(
        VendorProfile.objects.select_related('user').exclude(status=VendorStatus.SUSPENDED),
        slug=slug
    )


def get_vendor_by_id(vendor_id) -> VendorProfile:
    return get_object_or_404(
        VendorProfile.objects.select_related('bank_account', 'user'),
        id=vendor_id
    )


def get_vendor_bank_account(vendor_profile: VendorProfile) -> BankAccount:
    \"\"\"
    Returns linked BankAccount for vendor profile, or None if not set up.
    \"\"\"
    return BankAccount.objects.filter(vendor=vendor_profile).first()
"""

with open('g:/My Drive/Aso Backend/apps/common/permissions.py', 'w', encoding='utf-8') as f:
    f.write(permissions_code)

with open('g:/My Drive/Aso Backend/apps/vendors/selectors.py', 'w', encoding='utf-8') as f:
    f.write(selectors_code)

print("SUCCESS: Updated permissions.py and selectors.py in backend")
