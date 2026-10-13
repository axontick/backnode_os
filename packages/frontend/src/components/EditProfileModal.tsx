import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { authApi } from '../services/api';
import { resolveAvatarUrl } from '../utils/avatarUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useWorkspace();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      setErrorMessage('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OP';

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WEBP, GIF, SVG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Profile image size must be under 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authApi.uploadAvatar(formData);
      if (res?.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to upload profile photo';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Operator name cannot be empty');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        setErrorMessage('Current password is required to change password');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation do not match');
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim(),
        currentPassword: isChangingPassword ? currentPassword : undefined,
        newPassword: isChangingPassword ? newPassword : undefined,
      });

      showToast('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#121214] border border-[#27272a] rounded-[6px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between bg-[#0c0a09]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[6px] bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-sm font-semibold text-zinc-100 font-headline">
                Operator Profile
              </h2>
              <p className="text-[11px] text-zinc-400">
                Manage your personal identity, avatar image, and credentials
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] text-zinc-400 hover:text-zinc-100 hover:bg-[#18181b] border border-transparent hover:border-[#27272a] flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-[6px] bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 text-rose-400">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Profile Photo / Avatar Section */}
          <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={resolveAvatarUrl(avatarUrl)}
                  alt={name || 'Avatar'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/50 shadow-md bg-zinc-900"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-600 text-white font-mono font-bold text-xl flex items-center justify-center border-2 border-[#27272a] shadow-md">
                  {initials}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/75 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-orange-400 animate-spin">
                    progress_activity
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col gap-2 w-full text-center sm:text-left">
              <div>
                <span className="text-xs font-semibold text-zinc-200">Profile Image</span>
                <p className="text-[11px] text-zinc-400">
                  Upload a photo or paste a public image URL.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-[6px] bg-[#121214] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[14px] ${isUploadingAvatar ? 'animate-spin text-orange-400' : ''}`}>
                    {isUploadingAvatar ? 'progress_activity' : 'upload'}
                  </span>
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => {
                      setAvatarUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="px-2.5 py-1 rounded-[6px] bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-2.5 py-1 rounded-[6px] text-xs bg-[#121214] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Full Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-200 font-headline">
              Full Name <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="h-[34px] px-2.5 py-1.5 rounded-[6px] text-[13px] bg-[#18181b] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Email Address (Read-only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-200 font-headline flex items-center justify-between">
              <span>Account Email</span>
              <span className="text-[10px] text-zinc-500 font-normal">Primary Identity</span>
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="h-[34px] px-2.5 py-1.5 rounded-[6px] text-[13px] font-mono bg-[#18181b]/50 border border-[#27272a] text-zinc-400 cursor-not-allowed select-none"
            />
          </div>

          {/* Password Section */}
          <div className="pt-2 border-t border-[#27272a] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-200 font-headline">Security & Password</span>
                <p className="text-[11px] text-zinc-400">Change your login authentication password</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setErrorMessage('');
                }}
                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-colors border cursor-pointer ${
                  isChangingPassword
                    ? 'bg-orange-950/40 text-orange-400 border-orange-500/30'
                    : 'bg-[#18181b] text-zinc-300 border-[#27272a] hover:bg-zinc-800'
                }`}
              >
                {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {isChangingPassword && (
              <div className="p-3.5 rounded-[6px] bg-[#18181b] border border-[#27272a] flex flex-col gap-3 animate-in fade-in duration-150">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Current Password <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-[32px] px-2.5 py-1 rounded-[6px] text-xs bg-[#121214] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      New Password <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="h-[32px] px-2.5 py-1 rounded-[6px] text-xs bg-[#121214] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-zinc-300">
                      Confirm New Password <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="h-[32px] px-2.5 py-1 rounded-[6px] text-xs bg-[#121214] border border-[#27272a] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-[6px] border border-[#27272a] bg-[#18181b] hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 rounded-[6px] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[15px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
