import { useState } from "react";
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import Button from "@components/common/Button";
import Input from "@components/common/Input";
import Modal from "@components/common/Modal";
import { VALIDATION } from "@utils/constants";
import { toast } from "react-hot-toast";

const Profile = () => {
  const { user, getUserDisplayName, getUserRoleLabel, changeUsername, changePassword } = useAuth();

  // =====================================================
  // USERNAME CHANGE STATE
  // =====================================================
  const [usernameForm, setUsernameForm] = useState({
    new_username: "",
    current_password: "",
  });
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);

  // =====================================================
  // PASSWORD CHANGE STATE
  // =====================================================
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // =====================================================
  // USERNAME HANDLERS
  // =====================================================
  const handleUsernameChange = (e) => {
    const { name, value } = e.target;
    setUsernameForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateUsernameForm = () => {
    const { new_username, current_password } = usernameForm;

    if (!new_username.trim()) {
      toast.error("New username is required");
      return false;
    }

    if (new_username.length < VALIDATION.USERNAME.MIN_LENGTH || new_username.length > VALIDATION.USERNAME.MAX_LENGTH) {
      toast.error(`Username must be between ${VALIDATION.USERNAME.MIN_LENGTH} and ${VALIDATION.USERNAME.MAX_LENGTH} characters`);
      return false;
    }

    if (!VALIDATION.USERNAME.PATTERN.test(new_username)) {
      toast.error("Username can only contain letters, numbers, and underscores");
      return false;
    }

    if (!current_password) {
      toast.error("Current password is required");
      return false;
    }

    return true;
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (validateUsernameForm()) {
      setShowUsernameConfirm(true);
    }
  };

  const confirmUsernameChange = async () => {
    setUsernameLoading(true);
    try {
      await changeUsername(usernameForm);
      setUsernameForm({ new_username: "", current_password: "" });
      setShowUsernameConfirm(false);
    } catch (error) {
      // Error handled by error handler
    } finally {
      setUsernameLoading(false);
    }
  };

  // =====================================================
  // PASSWORD HANDLERS
  // =====================================================
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = () => {
    const { current_password, new_password, confirm_password } = passwordForm;

    if (!current_password) {
      toast.error("Current password is required");
      return false;
    }

    if (!new_password) {
      toast.error("New password is required");
      return false;
    }

    if (new_password.length < VALIDATION.PASSWORD.MIN_LENGTH || new_password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
      toast.error(`Password must be between ${VALIDATION.PASSWORD.MIN_LENGTH} and ${VALIDATION.PASSWORD.MAX_LENGTH} characters`);
      return false;
    }

    if (new_password !== confirm_password) {
      toast.error("New password and confirmation do not match");
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      setShowPasswordConfirm(true);
    }
  };

  const confirmPasswordChange = async () => {
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setShowPasswordConfirm(false);
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (error) {
      // Error handled by error handler
    } finally {
      setPasswordLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <h1 className="text-2xl font-bold text-primary">Profile Settings</h1>
        <p className="text-secondary mt-1">Manage your account information and security</p>
      </div>

      {/* User Info Card */}
      <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-primary">{getUserDisplayName()}</h2>
            <p className="text-sm text-secondary">{getUserRoleLabel()}</p>
            <p className="text-xs text-secondary mt-1">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Username Form */}
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Change Username</h3>
              <p className="text-xs text-secondary">Update your account username</p>
            </div>
          </div>

          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <Input label="New Username" name="new_username" type="text" value={usernameForm.new_username} onChange={handleUsernameChange} placeholder="Enter new username" required autoComplete="off" />

            <Input label="Current Password" name="current_password" type="password" value={usernameForm.current_password} onChange={handleUsernameChange} placeholder="Enter current password" required autoComplete="current-password" />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="medium" fullWidth disabled={usernameLoading}>
                {usernameLoading ? "Updating..." : "Update Username"}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Change Password</h3>
              <p className="text-xs text-secondary">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Current Password"
                name="current_password"
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => togglePasswordVisibility("current")} className="absolute right-3 top-[38px] text-secondary hover:text-primary transition-colors">
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New Password"
                name="new_password"
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => togglePasswordVisibility("new")} className="absolute right-3 top-[38px] text-secondary hover:text-primary transition-colors">
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                name="confirm_password"
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => togglePasswordVisibility("confirm")} className="absolute right-3 top-[38px] text-secondary hover:text-primary transition-colors">
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="medium" fullWidth disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Note */}
      <div className="backdrop-blur-md bg-blue-50/40 dark:bg-blue-500/5 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-500/10 shadow-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Security Tips</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-2 space-y-1">
              <li>• Use a strong password with at least {VALIDATION.PASSWORD.MIN_LENGTH} characters</li>
              <li>• Don't share your password with anyone</li>
              <li>• Change your password regularly for better security</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Username Confirmation Modal */}
      <Modal isOpen={showUsernameConfirm} onClose={() => setShowUsernameConfirm(false)} title="Confirm Username Change">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">You are about to change your username to:</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">@{usernameForm.new_username}</p>
            </div>
          </div>
          <p className="text-sm text-secondary">This action will update your login credentials. Are you sure you want to continue?</p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="medium" onClick={() => setShowUsernameConfirm(false)} fullWidth disabled={usernameLoading}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={confirmUsernameChange} fullWidth disabled={usernameLoading}>
              {usernameLoading ? "Updating..." : "Confirm Change"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Confirmation Modal */}
      <Modal isOpen={showPasswordConfirm} onClose={() => setShowPasswordConfirm(false)} title="Confirm Password Change">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-200 dark:border-green-500/20">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 dark:text-green-300 font-medium">You are about to change your password</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">Make sure you remember your new password</p>
            </div>
          </div>
          <p className="text-sm text-secondary">This action will update your login credentials. Are you sure you want to continue?</p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" size="medium" onClick={() => setShowPasswordConfirm(false)} fullWidth disabled={passwordLoading}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={confirmPasswordChange} fullWidth disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Confirm Change"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
