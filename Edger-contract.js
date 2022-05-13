/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

async function getCollectionName(ctx) {
    const mspid = ctx.clientIdentity.getMSPID();
    const collectionName = 'asset';
    return collectionName;
}

class EdgerContract extends Contract {

    async edgerExists(ctx, edgerId) {
        const collectionName = await getCollectionName(ctx);
        const data = await ctx.stub.getPrivateDataHash(collectionName, edgerId);
        return (!!data && data.length > 0);
    }

    async createEdger(ctx, edgerId) {
        const exists = await this.edgerExists(ctx, edgerId);
        if (exists) {
            throw new Error(`The asset edger ${edgerId} already exists`);
        }

        const privateAsset = {};

        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();

        const collectionName = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, edgerId, Buffer.from(JSON.stringify(privateAsset)));
    }

    async readEdger(ctx, edgerId) {
        const exists = await this.edgerExists(ctx, edgerId);
        if (!exists) {
            throw new Error(`The asset edger ${edgerId} does not exist`);
        }
        let privateDataString;
        const collectionName = await getCollectionName(ctx);
        const privateData = await ctx.stub.getPrivateData(collectionName, edgerId);
        privateDataString = JSON.parse(privateData.toString());
        return privateDataString;
    }

    async updateEdger(ctx, edgerId) {
        const exists = await this.edgerExists(ctx, edgerId);
        if (!exists) {
            throw new Error(`The asset edger ${edgerId} does not exist`);
        }
        const privateAsset = {};

        const transientData = ctx.stub.getTransient();
        if (transientData.size === 0 || !transientData.has('privateValue')) {
            throw new Error('The privateValue key was not specified in transient data. Please try again.');
        }
        privateAsset.privateValue = transientData.get('privateValue').toString();

        const collectionName = await getCollectionName(ctx);
        await ctx.stub.putPrivateData(collectionName, edgerId, Buffer.from(JSON.stringify(privateAsset)));
    }

    async deleteEdger(ctx, edgerId) {
        const exists = await this.edgerExists(ctx, edgerId);
        if (!exists) {
            throw new Error(`The asset edger ${edgerId} does not exist`);
        }
        const collectionName = await getCollectionName(ctx);
        await ctx.stub.deletePrivateData(collectionName, edgerId);
    }

    async verifyEdger(ctx, mspid, edgerId, objectToVerify) {

        // Convert provided object into a hash
        const hashToVerify = crypto.createHash('sha256').update(objectToVerify).digest('hex');
        const pdHashBytes = await ctx.stub.getPrivateDataHash(`_implicit_org_${mspid}`, edgerId);
        if (pdHashBytes.length === 0) {
            throw new Error('No private data hash with the key: ' + edgerId);
        }

        const actualHash = Buffer.from(pdHashBytes).toString('hex');

        // Compare the hash calculated (from object provided) and the hash stored on public ledger
        if (hashToVerify === actualHash) {
            return true;
        } else {
            return false;
        }
    }


}

module.exports = EdgerContract;
