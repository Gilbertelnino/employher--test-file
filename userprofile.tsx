import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Grid, MenuItem, IconButton, Menu } from "@material-ui/core";
import { AccountCircle as AccountCircleIcon } from "@material-ui/icons";
import { useForm } from "react-hook-form";
import _ from "lodash";

import appRoutes from "../../routes/app.routes";
import UserAvatar from "./UserAvatar";
import { Button, Modal, Input } from "../../components/common";
import { tabChangeRequest } from "../../reducers/company/tabChange.reducer";
import authServices from "../../services/auth.services";
import { FlashMessage } from "./index";
import { rootReducersState } from "../../reducers";
import { sessionOutRequest } from "../../reducers/auth/session.reducer";

type FormInputs = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

interface UserProfileIconInterface {
  showProfile?: boolean;
}

const UserProfileIcon = (props: UserProfileIconInterface) => {
  const dispatch = useDispatch();
  const history = useHistory();

  // States
  const [showPasswordChangeModal, setShowPasswordChangeModal] =
    useState<boolean>(false);
  const [changePasswordLoading, setChangePasswordLoading] =
    useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showCreateCompanyModal, setShowCreateCompanyModal] =
    useState<boolean>(false);

  // Reducers
  const sessionReducer = useSelector(
    ({ session }: rootReducersState) => session
  );
  const {
    companyProfile: {
      data: { profile_image, slug },
    },
  } = useSelector(({ company }: any) => company);
  const userData = _.get(sessionReducer, "currentUser", {});
  const token = _.get(sessionReducer, "token", null);

  // Hooks
  const {
    register,
    handleSubmit,
    errors,
    watch,
    setError,
    reset: resetForm,
    control,
  } = useForm<FormInputs>();
  const currentMatchingPassword = watch("newPassword", "");

  const open = Boolean(anchorEl);
  const role = _.get(userData, "role", "");
  const userFullName = `${_.get(userData, "first_name", "")} ${_.get(
    userData,
    "last_name",
    ""
  )} `;
  let imagePath = _.get(userData, "profile_image", "");

  if (role === "company") {
    imagePath = profile_image
      ? profile_image
      : _.get(userData, "profile_image", "");
  }
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const setProfilePreview = () => {
    if (!_.isUndefined(slug)) {
      const win = window.open(
        appRoutes.companyPublicPageHome.generatePath(slug),
        "_blank"
      );
      win.focus();
    }
  };

  const handleClose = (redirect: boolean) => {
    setAnchorEl(null);

    if (redirect) {
      if (role === "company") {
        history.push(appRoutes.companyPage.path);
      } else if (role === "candidate") {
        history.push(appRoutes.candidateProfileView.path);
      } else {
        history.push("/");
      }
    }
  };

  const handleEdit = () => {
    if (role === "company") {
      dispatch(tabChangeRequest({ tab: "page" }));
      history.push(appRoutes.companyPageHome.path);
    } else if (role === "candidate") {
      history.push(appRoutes.candidateProfile.path);
    }
  };

  const handleConnectionList = () => {
    history.push(appRoutes.candidateConnections.path);
  };

  const _handleLogout = () => {
    dispatch(sessionOutRequest());
  };

  const _handleShowPasswordChangeModal = () => {
    setShowPasswordChangeModal(true);
    setAnchorEl(null);
  };

  const _handleClosePasswordChangeModal = () => {
    // Close only if request is not in progress
    if (!changePasswordLoading) {
      setShowPasswordChangeModal(false);
      resetForm({});
    }
  };

  const _handleShowCreateCompanyModal = () => {
    setShowCreateCompanyModal(true);
    setAnchorEl(null);
  };

  const _handleCloseCreateCompanyModal = () => {
    setShowCreateCompanyModal(false);
    resetForm({});
  };

  const onSubmit = async (formData: FormInputs) => {
    setChangePasswordLoading(true);
    try {
      const result = await authServices.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Check if password changed successfully
      if (_.get(result, "flag", false) === true) {
        FlashMessage(_.get(result, "message", "Password changed successfully"));
        setShowPasswordChangeModal(false);
        resetForm({});
      } else {
        const errors = _.get(result, "errors", {});

        if (!_.isEmpty(errors)) {
          for (const [fieldName, errMsg] of Object.entries(errors)) {
            setError(fieldName as keyof FormInputs, {
              type: "manual",
              message: errMsg as string,
            });
          }
        }
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <>
      {!token ? (
        <div className="ml-md-5 nav-item">
          <Link to={appRoutes.userLogin.path}>{appRoutes.userLogin.title}</Link>
        </div>
      ) : (
        <div className="ml-md-5 nav-item profile-link ml-0">
          {_.isEmpty(imagePath) ? (
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircleIcon className="profile-icon" />
            </IconButton>
          ) : (
            <UserAvatar
              size="md"
              src={imagePath}
              variant="circular"
              onClick={handleMenu}
            />
          )}
          <Menu
            id="menu-appbar"
            className="profile-menu-option-wrapper"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={open}
            onClose={() => handleClose(false)}
          >
            <div className="profile-box-wrapper">
              <div className="pb-header">
                <div
                  className="pb-user-avatar"
                  onClick={() => setProfilePreview()}
                >
                  <img className="profile-image" src={imagePath} />
                </div>
                <div className="pb-control">
                  <h5>{userFullName}</h5>
                  <div className="pb-control-btns">
                    <Button
                      variant="outlined"
                      className="btn-small btn-transparent btn-small-transparant"
                      onClick={() => handleEdit()}
                    >
                      EDIT PROFILE
                    </Button>
                  </div>
                </div>
              </div>
              {props.showProfile === true && (
                <MenuItem onClick={() => handleClose(true)}>
                  View Profile
                </MenuItem>
              )}
              {props.showProfile === true && (
                <MenuItem onClick={() => _handleShowCreateCompanyModal()}>
                  Create a company
                </MenuItem>
              )}
              {role === "candidate" && (
                <>
                  <MenuItem
                    onClick={() => {
                      history.push(appRoutes.connectionNotifications.path);
                    }}
                  >
                    {appRoutes.connectionNotifications.title}
                  </MenuItem>
                  <MenuItem onClick={() => handleConnectionList()}>
                    {appRoutes.candidateConnections.title}
                  </MenuItem>
                </>
              )}
              <MenuItem onClick={() => _handleShowPasswordChangeModal()}>
                Change Password
              </MenuItem>
              <MenuItem onClick={() => _handleLogout()}>Logout</MenuItem>
            </div>
          </Menu>
        </div>
      )}

      {!_.isEmpty(role) && (
        <Modal
          visible={showPasswordChangeModal}
          onClose={() => _handleClosePasswordChangeModal()}
          title="Change Password"
          className="change-pw-modal"
        >
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} className="pb-0">
                <Input
                  name="currentPassword"
                  type="password"
                  externalLabel={{ label: "Current password" }}
                  placeholder="Current password"
                  validationObj={errors}
                  inputRef={register({
                    required: {
                      value: true,
                      message: "Please enter current password",
                    },
                  })}
                />
              </Grid>
              <Grid item xs={12} className="pb-0">
                <Input
                  name="newPassword"
                  type="password"
                  externalLabel={{ label: "New password" }}
                  placeholder="New password"
                  validationObj={errors}
                  inputRef={register({
                    required: {
                      value: true,
                      message: "Please enter new password",
                    },
                    pattern: {
                      value:
                        /^(?=.*[a-z])(?!.* )(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
                      message:
                        "Must content at least one upper case, lower case, digit, special character and no white space",
                    },
                  })}
                />
              </Grid>
              <Grid item xs={12} className="pb-0">
                <Input
                  name="confirmPassword"
                  type="password"
                  externalLabel={{ label: "Confirm password" }}
                  placeholder="Confirm password"
                  validationObj={errors}
                  inputRef={register({
                    required: {
                      value: true,
                      message: "Please enter confirm password",
                    },
                    validate: (value) =>
                      value === currentMatchingPassword ||
                      "The re-entered do not match",
                  })}
                />
              </Grid>
              <Grid item xs={12} className="text-right form-actions">
                <Button
                  onClick={() => _handleClosePasswordChangeModal()}
                  color="secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="primary-btn"
                  loading={changePasswordLoading}
                >
                  Change
                </Button>
              </Grid>
            </Grid>
          </form>
        </Modal>
      )}

      {/* create company popup */}
      {!_.isEmpty(role) && (
        <Modal
          visible={showCreateCompanyModal}
          onClose={() => _handleCloseCreateCompanyModal()}
          title="Create a company"
          className="create-company-modal"
          size="x-large"
        >
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12} className="pb-0">
                <Input
                  name="Banner"
                  type="file"
                  externalLabel={{ label: "Banner" }}
                  placeholder="Banner"
                />
              </Grid>
              <Grid item xs={12} className="pb-0">
                <Input
                  name="companyProfile"
                  type="file"
                  externalLabel={{ label: "Company profile" }}
                  placeholder="profile"
                />
              </Grid>
              <Grid container>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="Name"
                    type="text"
                    externalLabel={{ label: "Name" }}
                    placeholder="Name"
                    validationObj={errors}
                    inputRef={register({
                      required: {
                        value: true,
                        message: "Please enter company name",
                      },
                    })}
                  />
                </Grid>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="Industry"
                    type="text"
                    externalLabel={{ label: "Industry" }}
                    placeholder="Select an industry"
                    validationObj={errors}
                    inputRef={register({
                      required: {
                        value: true,
                        message: "Please enter company industry",
                      },
                    })}
                  />
                </Grid>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="Location"
                    type="text"
                    externalLabel={{ label: "Location" }}
                    placeholder="Enter a location"
                    validationObj={errors}
                    inputRef={register({
                      required: {
                        value: true,
                        message: "Please enter company location",
                      },
                    })}
                  />
                </Grid>
              </Grid>
              <Grid container>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="EmployeeSize"
                    type="text"
                    externalLabel={{ label: "Employee size" }}
                    placeholder="Select the number of employees"
                    validationObj={errors}
                    inputRef={register({
                      required: {
                        value: true,
                        message: "Please enter company employee size",
                      },
                    })}
                  />
                </Grid>
                <Grid item xs={8} className="pb-0">
                  <Input
                    name="Website"
                    type="text"
                    externalLabel={{ label: "Website" }}
                    placeholder="URL"
                    validationObj={errors}
                    inputRef={register({
                      required: {
                        value: true,
                        message: "Please enter company website",
                      },
                    })}
                  />
                </Grid>
              </Grid>
              <Grid container>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="WhoWeAre"
                    type="text"
                    externalLabel={{ label: "Who we are" }}
                    placeholder="Write here"
                  />
                </Grid>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="MissionAndVision"
                    type="text"
                    externalLabel={{ label: "Mission and Vision" }}
                    placeholder="Write mission and vision here"
                  />
                </Grid>
                <Grid item xs={4} className="pb-0">
                  <Input
                    name="DiversityAndInclusion"
                    type="text"
                    externalLabel={{ label: "diversity and inclusion" }}
                    placeholder="write diversity and inclusion here"
                  />
                </Grid>
              </Grid>
              <Grid item xs={12} className="text-right form-actions">
                <Button
                  type="submit"
                  className="primary-btn"
                  // loading={createCompanyLoading}
                >
                  CREATE COMPANY
                </Button>
                <Button
                  onClick={() => _handleCloseCreateCompanyModal()}
                  color="secondary"
                >
                  CANCEL
                </Button>
              </Grid>
            </Grid>
          </form>
        </Modal>
      )}
    </>
  );
};

// Default props of the component
UserProfileIcon.defaultProps = {
  showProfile: true,
};

export default UserProfileIcon;
