//add this guard clause: to prevent locked member from loging in
login(uid) {
    const user = MEMBER_LIST.find(m => m.security.uid === uid);
    if (user && user.isFrozen) {
        throw new Error("IDENTITY_LOCKED: Your account has been frozen.");
    }
    // Proceed with login...
}

--------------------------------------------------------------
