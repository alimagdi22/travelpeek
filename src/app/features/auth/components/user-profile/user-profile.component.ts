import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserProfileService } from 'rp-travel-ui';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  standalone: false,
})
export class UserProfileComponent implements OnInit, OnDestroy {
  isChangePasswordShowed = false;
  isPhoneNumberValid = false;
  genderOptions = ['Male', 'Female'];

  userProfileService = inject(UserProfileService);
  subscription = new Subscription();

  ngOnInit(): void {
    this.userProfileService.initProfileForm();
    this.userProfileService.initChangePasswordForm();

    const user = this.userProfileService.user;

    this.profileForm.controls['firstName'].setValue(user.firstName);
    this.profileForm.controls['lastName'].setValue(user.lastName);
    this.profileForm.controls['userPhoneNumber'].setValue(user.phoneNumber);
    this.profileForm.controls['userPhoneNumber'].disable();

    this.subscription.add(
      this.userProfileService.notify.subscribe({
        next: (status) => {
          if (status === 2) {
            if (this.isChangePasswordShowed) {
              Swal.fire({
                icon: 'success',
                title: 'Password Changed',
                text: 'Your password has been changed successfully.',
              });
              this.isChangePasswordShowed = false;
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile information has been updated successfully.',
              });
            }
          } else if (status === 1) {
            if (this.isChangePasswordShowed) {
              Swal.fire({
                icon: 'error',
                title: 'Change Failed',
                text: 'Failed to change your password. Please try again.',
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update your profile. Please try again.',
              });
            }
          } else if (status === 0) {
            const user = this.userProfileService.user;

            this.profileForm.controls['firstName'].setValue(user.firstName);
            this.profileForm.controls['lastName'].setValue(user.lastName);
            this.profileForm.controls['userPhoneNumber'].setValue(user.phoneNumber);
            this.profileForm.controls['userPhoneNumber'].disable();
          }
        },
      })
    );
  }

  checkPhoneNumberValidation() {
    if (
      this.profileForm.get('userPhoneNumber')!.invalid &&
      (this.profileForm.get('userPhoneNumber')!.touched || this.profileForm.get('userPhoneNumber')!.dirty)
    ) {
      this.isPhoneNumberValid = true;
    } else {
      this.isPhoneNumberValid = false;
    }
  }

  onSubmit() {
    if (!this.userProfileService.profileForm.invalid) {
      this.userProfileService.editUserProfile();
    }
  }

  onChangePassword() {
    if (!this.userProfileService.changePasswordForm.invalid) {
      this.userProfileService.changePassword();
    }
  }

  canDeactivate(): boolean {
    if ((this.profileForm.dirty || this.changePasswordForm.dirty) && this.isChangePasswordShowed) {
      return confirm('You have unsaved changes. Do you really want to leave?');
    }
    return true;
  }

  get firstName() {
    return this.userProfileService.user.firstName;
  }

  get lastName() {
    return this.userProfileService.user.lastName;
  }

  get email() {
    return this.userProfileService.user.email;
  }

  get phoneNumber() {
    return this.userProfileService.user.phoneNumber;
  }

  get profileForm() {
    return this.userProfileService.profileForm;
  }

  get changePasswordForm() {
    return this.userProfileService.changePasswordForm;
  }

  get isLoading() {
    return this.userProfileService.isLoading;
  }

  get getFirstNameErrorMessage() {
    return this.userProfileService.getFirstNameErrorMessage;
  }

  get getLastNameErrorMessage() {
    return this.userProfileService.getLastNameErrorMessage;
  }

  get getPhoneErrorMessage() {
    return this.userProfileService.getPhoneErrorMessage;
  }

  get getPasswordErrorMessage() {
    return this.userProfileService.getPasswordErrorMessage;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
