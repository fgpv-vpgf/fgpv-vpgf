# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network "forwarded_port", guest: 6002, host: 6002
  config.vm.network "forwarded_port", guest: 6004, host: 6004

  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate//vagrant","1"]
  end

  config.vm.provision "shell", inline: <<-SHELL
    curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
    echo 'deb https://deb.nodesource.com/node_6.x trusty main' > /etc/apt/sources.list.d/nodesource.list
    apt-get update
    apt-get install -y nodejs build-essential git
    cd /vagrant
    sudo npm install -g gulp
    sudo npm install
    # sudo apt-get install -y apache2
  SHELL
end
