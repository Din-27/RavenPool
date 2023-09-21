echo "INSTALL COIN RAVEN"
echo "Please do NOT run as root, run as the pool user!"

echo "Installing... Please wait!"

adduser pool
usermod -aG sudo pool
su - pool

sudo apt install wget
wget https://github.com/RavenProject/Ravencoin/releases/download/v4.3.2.1/raven-4.3.2.1-x86_64-linux-gnu.zip

unzip raven-4.3.2.1-x86_64-linux-gnu.zip
rm raven*zip
cd linux
tar -xvf raven-4.3.2.1-x86_64-linux-gnu.tar.gz
rm raven*gz

cd raven-4.3.2.1/bin
mkdir -p ~/.raven/
touch ~/.raven/raven.conf

echo "rpcuser=user1" > ~/.raven/raven.conf
echo "rpcpassword=pass1" >> ~/.raven/raven.conf
echo "prune=550" >> ~/.raven/raven.conf
echo "daemon=1" >> ~/.raven/raven.conf
./ravend
./raven-cli getnewaddress

echo "Installation completed!"

exit 0