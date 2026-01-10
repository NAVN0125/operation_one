import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, account }) {
            // Persist the Google ID token to the JWT
            if (account) {
                token.idToken = account.id_token;
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            // Attach the ID token to the session for backend auth
            session.idToken = token.idToken as string;
            return session;
        },
    },
});
