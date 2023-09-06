import ldap from "ldapjs";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
const client = ldap.createClient({
  url: process.env.LDAP_URI as string,
});
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "LDAP",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Essentially promisify the LDAPJS client.bind function
        return new Promise((resolve, reject) => {
          if (credentials === undefined) {
            reject("No credentials provided");
          }
          client.bind(
            `uid=${credentials?.username},cn=users,dc=cgilab,dc=nctu,dc=edu,dc=tw`,
            credentials?.password as string,
            (error) => {
              if (error) {
                console.error("Failed");
                console.log(error);
                reject(error);
              } else {
                console.log("Logged in");
                resolve({
                  id: credentials?.username as string,
                  name: credentials?.username,
                });
              }
            },
          );
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const isSignIn = user ? true : false;
      if (isSignIn) {
        token.username = user.name;
      }
      return token;
    },
    async session({ session, token, user }) {
      return { ...session, user };
    },
  },
  // pages:{
  //   signIn: "/auth/signin",
  // }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
